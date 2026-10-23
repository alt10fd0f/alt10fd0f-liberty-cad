// Server-side ER:LC API client. Never import this from client components:
// it reads the server key from the environment.

const BASE = "https://api.erlc.gg";

export type ErlcPlayer = {
  Team: string;
  Player: string; // "Name:Id"
  Callsign: string | null;
  Location: {
    LocationX: number;
    LocationZ: number;
    PostalCode: string;
    StreetName: string;
    BuildingNumber: string;
  };
  Permission: string;
  WantedStars: number;
};

export type ErlcEmergencyCall = {
  Team: string;
  Caller: number;
  Players: number[];
  Position: [number, number];
  StartedAt: number;
  CallNumber: number;
  Description: string;
  PositionDescriptor: string;
};

export type ErlcServer = {
  Name: string;
  OwnerId: number;
  CoOwnerIds: number[];
  CurrentPlayers: number;
  MaxPlayers: number;
  JoinKey: string;
  AccVerifiedReq: string;
  TeamBalance: boolean;
  Players?: ErlcPlayer[];
  Staff?: {
    Admins?: Record<string, string>;
    Mods?: Record<string, string>;
    Helpers?: Record<string, string>;
  };
  JoinLogs?: { Join: boolean; Timestamp: number; Player: string }[];
  Queue?: number[];
  KillLogs?: { Killed: string; Killer: string; Timestamp: number }[];
  CommandLogs?: { Player: string; Timestamp: number; Command: string }[];
  ModCalls?: { Caller: string; Moderator: string | null; Timestamp: number }[];
  EmergencyCalls?: ErlcEmergencyCall[];
  Vehicles?: {
    Name: string;
    Owner: string;
    Plate: string;
    Texture: string | null;
    ColorHex: string;
    ColorName: string;
  }[];
};

export class ErlcError extends Error {
  status: number;
  retryAfter?: number;
  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function headers(): Record<string, string> {
  const key = process.env.ERLC_SERVER_KEY;
  if (!key) throw new ErlcError("ERLC_SERVER_KEY is not configured.", 500);
  const h: Record<string, string> = {
    "server-key": key,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (process.env.ERLC_GLOBAL_KEY) h.Authorization = process.env.ERLC_GLOBAL_KEY;
  return h;
}

// Short in-memory cache + in-flight de-duplication so many viewers never
// multiply requests against the ER:LC rate limit.
const TTL_MS = 4000;
let cache: { at: number; data: ErlcServer } | null = null;
let inflight: Promise<ErlcServer> | null = null;
let blockedUntil = 0;

const ALL_FLAGS = [
  "Players",
  "Staff",
  "JoinLogs",
  "Queue",
  "KillLogs",
  "CommandLogs",
  "ModCalls",
  "EmergencyCalls",
  "Vehicles",
];

export async function getServer(): Promise<ErlcServer> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.data;
  if (now < blockedUntil) {
    if (cache) return cache.data;
    throw new ErlcError("Rate limited by ER:LC API.", 429, Math.ceil((blockedUntil - now) / 1000));
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const qs = ALL_FLAGS.map((f) => `${f}=true`).join("&");
    const res = await fetch(`${BASE}/v2/server?${qs}`, { headers: headers(), cache: "no-store" });

    if (res.status === 429) {
      const retry = Number(res.headers.get("Retry-After") ?? "5");
      blockedUntil = Date.now() + retry * 1000; // obey Retry-After fully
      if (cache) return cache.data;
      throw new ErlcError("Rate limited by ER:LC API.", 429, retry);
    }
    if (!res.ok) {
      let msg = `ER:LC API error (${res.status})`;
      try {
        const body = await res.json();
        msg = body.message ?? body.error ?? msg;
      } catch {
        /* ignore */
      }
      throw new ErlcError(msg, res.status);
    }
    const data = (await res.json()) as ErlcServer;
    cache = { at: Date.now(), data };
    return data;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export async function runCommand(command: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/v2/server/command`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ command }),
    cache: "no-store",
  });
  if (res.status === 429) {
    throw new ErlcError("Commands are limited to 1 per 5 seconds.", 429, Number(res.headers.get("Retry-After") ?? "5"));
  }
  let body: { message?: string } = {};
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) throw new ErlcError(body.message ?? `Command failed (${res.status})`, res.status);
  return { message: body.message ?? "Success" };
}
