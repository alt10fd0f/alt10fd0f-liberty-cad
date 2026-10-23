"use client";

import MapView from "@/components/MapView";
import { useSettings } from "@/lib/settings";
import { useServer } from "@/lib/useServer";

export default function MapPage() {
  const { data, error } = useServer(5000);
  const { settings, ready } = useSettings();

  if (!ready) return null;

  return (
    <div className="page wide">
      <h1>Live map</h1>
      {error && <p className="err">{error}</p>}
      {!data ? <p>Loading…</p> : <MapView players={data.Players ?? []} calls={data.EmergencyCalls ?? []} settings={settings} />}
    </div>
  );
}
