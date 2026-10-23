"use client";

import { useMemo, useState } from "react";
import type { ErlcEmergencyCall, ErlcPlayer } from "@/lib/erlc";
import { MAP_SIZE, mapUrl, resolveSeason, toPercent } from "@/lib/maps";
import type { Settings } from "@/lib/settings";
import { parsePlayer } from "@/lib/useServer";

const TEAM_COLORS: Record<string, string> = {
  Police: "#3b82f6",
  Sheriff: "#a16207",
  Fire: "#ef4444",
  EMS: "#f97316",
  DOT: "#eab308",
  Civilian: "#9ca3af",
  Jail: "#6b7280",
};

export default function MapView({
  players,
  calls,
  settings,
}: {
  players: ErlcPlayer[];
  calls: ErlcEmergencyCall[];
  settings: Settings;
}) {
  const [zoom, setZoom] = useState(0.25); // fraction of the 5355px image
  const [filter, setFilter] = useState<string>("All");

  const season = resolveSeason(settings.mapMode);
  const src = mapUrl(settings.mapMode, settings.postals);
  const width = MAP_SIZE * zoom;

  const teams = useMemo(() => ["All", ...Array.from(new Set(players.map((p) => p.Team)))], [players]);
  const visible = players.filter((p) => filter === "All" || p.Team === filter);

  return (
    <div className="mapwrap">
      <div className="maptools">
        <span className="pill">{season === "winter" ? "Winter map" : "Fall map"}{settings.mapMode === "auto" ? " (auto)" : ""}</span>
        <button onClick={() => setZoom((z) => Math.max(0.1, z - 0.05))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(1, z + 0.05))}>+</button>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {teams.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="mapscroll">
        <div className="mapstage" style={{ width, height: width }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="ER:LC map" draggable={false} style={{ width: "100%", height: "100%" }} />

          {calls.map((c) => {
            const { left, top } = toPercent(c.Position[0], c.Position[1]);
            return (
              <div key={c.CallNumber} className="callmark" style={{ left: `${left}%`, top: `${top}%` }} title={`#${c.CallNumber} ${c.Team}: ${c.Description}`}>
                !
              </div>
            );
          })}

          {visible.map((p) => {
            const { left, top } = toPercent(p.Location.LocationX, p.Location.LocationZ);
            const { name } = parsePlayer(p.Player);
            const color = settings.teamColors ? TEAM_COLORS[p.Team] ?? "#9ca3af" : "#38bdf8";
            return (
              <div key={p.Player} className="marker" style={{ left: `${left}%`, top: `${top}%` }} title={`${name} · ${p.Team} · ${p.Location.StreetName} (${p.Location.PostalCode})`}>
                <span className="dot" style={{ background: color, width: settings.markerSize, height: settings.markerSize }} />
                {settings.showCallsigns && (p.Callsign || p.Team !== "Civilian") && <span className="label">{p.Callsign ?? name}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
