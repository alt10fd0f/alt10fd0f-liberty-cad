"use client";

import { useCallback, useEffect, useState } from "react";
import type { MapMode } from "./maps";

export type Settings = {
  mapMode: MapMode; // auto follows the season, or force fall / winter
  postals: boolean; // use the map variant with postal codes
  showCallsigns: boolean;
  markerSize: number; // px
  teamColors: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  mapMode: "auto",
  postals: true,
  showCallsigns: true,
  markerSize: 12,
  teamColors: true,
};

const KEY = "liberty-cad:settings:v1";

// Stored per browser for now. Swap for a DB row keyed by user id once login exists.
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { settings, update, ready };
}
