"use client";

import { useEffect, useState } from "react";
import type { ErlcServer } from "./erlc";

export function useServer(intervalMs = 6000) {
  const [data, setData] = useState<ErlcServer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      let wait = intervalMs;
      try {
        const res = await fetch("/api/erlc", { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) {
          setError(body.error ?? "Request failed");
          if (res.status === 429 && body.retryAfter) wait = Math.max(wait, body.retryAfter * 1000);
          // A 403 usually means the key was regenerated: back off hard.
          if (res.status === 403) wait = 60000;
        } else {
          setData(body);
          setError(null);
        }
      } catch {
        setError("Network error");
      }
      if (!stop) timer = setTimeout(tick, wait);
    }
    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [intervalMs]);

  return { data, error };
}

export function parsePlayer(s: string): { name: string; id: string } {
  const i = s.lastIndexOf(":");
  return i === -1 ? { name: s, id: "" } : { name: s.slice(0, i), id: s.slice(i + 1) };
}
