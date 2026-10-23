"use client";

import { parsePlayer, useServer } from "@/lib/useServer";

export default function DispatchPage() {
  const { data, error } = useServer(5000);
  const calls = [...(data?.EmergencyCalls ?? [])].sort((a, b) => b.StartedAt - a.StartedAt);
  const players = data?.Players ?? [];
  const units = players.filter((p) => p.Team !== "Civilian");
  const nameById = new Map(players.map((p) => [parsePlayer(p.Player).id, parsePlayer(p.Player).name]));

  return (
    <div className="page">
      <h1>Dispatch</h1>
      {error && <p className="err">{error}</p>}

      <div className="grid two">
        <section className="card">
          <h2>Active calls ({calls.length})</h2>
          {calls.length === 0 && <p className="muted">No active calls.</p>}
          <ul className="list">
            {calls.map((c) => (
              <li key={c.CallNumber}>
                <strong>#{c.CallNumber} · {c.Team}</strong>
                <div>{c.Description || "No description"}</div>
                <div className="muted small">
                  {c.PositionDescriptor || "Unknown location"} · caller {nameById.get(String(c.Caller)) ?? c.Caller} · {c.Players.length} responding
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Units on duty ({units.length})</h2>
          <table>
            <thead><tr><th>Callsign</th><th>Name</th><th>Team</th><th>Location</th></tr></thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.Player}>
                  <td>{u.Callsign ?? "—"}</td>
                  <td>{parsePlayer(u.Player).name}</td>
                  <td>{u.Team}</td>
                  <td>{u.Location.StreetName} ({u.Location.PostalCode})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
