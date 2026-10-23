"use client";

import { useState } from "react";
import { parsePlayer, useServer } from "@/lib/useServer";

function ago(ts: number) {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function Dashboard() {
  const { data, error } = useServer();
  const [cmd, setCmd] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!cmd.trim()) return;
    setBusy(true);
    const res = await fetch("/api/erlc/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: cmd }),
    });
    const body = await res.json().catch(() => ({}));
    setResult(res.ok ? `✓ ${body.message}` : `✗ ${body.error ?? "Failed"}`);
    if (res.ok) setCmd("");
    setBusy(false);
  }

  if (!data) return <div className="page">{error ? <p className="err">{error}</p> : <p>Loading server…</p>}</div>;

  const staff = data.Staff ?? {};
  const staffCount = Object.keys(staff.Admins ?? {}).length + Object.keys(staff.Mods ?? {}).length + Object.keys(staff.Helpers ?? {}).length;
  const onDuty = (data.Players ?? []).filter((p) => p.Team !== "Civilian");

  return (
    <div className="page">
      {error && <p className="err">Live data delayed: {error}</p>}
      <h1>{data.Name}</h1>
      <p className="muted">Join code: {data.JoinKey}</p>

      <div className="grid stats">
        <div className="card"><span className="big">{data.CurrentPlayers}/{data.MaxPlayers}</span>Players</div>
        <div className="card"><span className="big">{data.Queue?.length ?? 0}</span>In queue</div>
        <div className="card"><span className="big">{onDuty.length}</span>On duty</div>
        <div className="card"><span className="big">{data.EmergencyCalls?.length ?? 0}</span>Active calls</div>
        <div className="card"><span className="big">{staffCount}</span>Staff listed</div>
        <div className="card"><span className="big">{data.Vehicles?.length ?? 0}</span>Vehicles</div>
      </div>

      <div className="grid two">
        <section className="card">
          <h2>Command console</h2>
          <div className="row">
            <input value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder=":h Welcome to the server!" />
            <button disabled={busy} onClick={send}>Run</button>
          </div>
          {result && <p className="muted">{result}</p>}
          <p className="muted small">Limited to one command every 5 seconds by ER:LC.</p>
        </section>

        <section className="card">
          <h2>Mod calls</h2>
          {(data.ModCalls ?? []).length === 0 && <p className="muted">None.</p>}
          <ul className="list">
            {(data.ModCalls ?? []).slice(-8).reverse().map((m, i) => (
              <li key={i}>
                {parsePlayer(m.Caller).name} <span className="muted">{ago(m.Timestamp)} · {m.Moderator ? `answered by ${parsePlayer(m.Moderator).name}` : "unanswered"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Join / leave</h2>
          <ul className="list">
            {(data.JoinLogs ?? []).slice(-10).reverse().map((j, i) => (
              <li key={i}>
                {parsePlayer(j.Player).name} <span className="muted">{j.Join ? "joined" : "left"} · {ago(j.Timestamp)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Kill logs</h2>
          <ul className="list">
            {(data.KillLogs ?? []).slice(-10).reverse().map((k, i) => (
              <li key={i}>
                {parsePlayer(k.Killer).name} → {parsePlayer(k.Killed).name} <span className="muted">{ago(k.Timestamp)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Command logs</h2>
          <ul className="list">
            {(data.CommandLogs ?? []).slice(-10).reverse().map((c, i) => (
              <li key={i}>
                {parsePlayer(c.Player).name}: <code>{c.Command}</code> <span className="muted">{ago(c.Timestamp)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Staff</h2>
          {(["Admins", "Mods", "Helpers"] as const).map((role) => (
            <p key={role} className="small"><strong>{role}:</strong> {Object.values(staff[role] ?? {}).join(", ") || "—"}</p>
          ))}
        </section>
      </div>
    </div>
  );
}
