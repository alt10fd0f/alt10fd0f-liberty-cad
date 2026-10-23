"use client";

import type { MapMode } from "@/lib/maps";
import { mapUrl, resolveSeason } from "@/lib/maps";
import { DEFAULT_SETTINGS, useSettings } from "@/lib/settings";

export default function SettingsPage() {
  const { settings, update, ready } = useSettings();
  if (!ready) return null;

  const season = resolveSeason(settings.mapMode);

  return (
    <div className="page">
      <h1>Settings</h1>

      <section className="card">
        <h2>Map appearance</h2>

        <label className="field">
          <span>Map theme</span>
          <select value={settings.mapMode} onChange={(e) => update({ mapMode: e.target.value as MapMode })}>
            <option value="auto">Automatic (follows the season)</option>
            <option value="fall">Fall</option>
            <option value="winter">Winter</option>
          </select>
        </label>
        <p className="muted small">Currently showing the {season} map.</p>

        <label className="check">
          <input type="checkbox" checked={settings.postals} onChange={(e) => update({ postals: e.target.checked })} />
          Show postal codes
        </label>

        <label className="check">
          <input type="checkbox" checked={settings.teamColors} onChange={(e) => update({ teamColors: e.target.checked })} />
          Colour markers by team
        </label>

        <label className="check">
          <input type="checkbox" checked={settings.showCallsigns} onChange={(e) => update({ showCallsigns: e.target.checked })} />
          Show callsigns on markers
        </label>

        <label className="field">
          <span>Marker size: {settings.markerSize}px</span>
          <input type="range" min={6} max={28} value={settings.markerSize} onChange={(e) => update({ markerSize: Number(e.target.value) })} />
        </label>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="preview" src={mapUrl(settings.mapMode, settings.postals)} alt="Map preview" />

        <button onClick={() => update(DEFAULT_SETTINGS)}>Reset to defaults</button>
      </section>
    </div>
  );
}
