// Official ER:LC map images (5355 x 5355 px). See https://apidocs.erlc.gg/official-map-images
export const MAP_SIZE = 5355;

export type Season = "fall" | "winter";
export type MapMode = "auto" | Season;

export const MAP_URLS: Record<Season, { blank: string; postals: string }> = {
  fall: {
    blank: "https://api.erlc.gg/maps/fall_blank.png",
    postals: "https://api.erlc.gg/maps/fall_postals.png",
  },
  winter: {
    blank: "https://api.erlc.gg/maps/snow_blank.png",
    postals: "https://api.erlc.gg/maps/snow_postals.png",
  },
};

// Only fall and winter maps are officially published right now.
// Dec-Feb -> winter, everything else -> fall. Tweak to taste.
export function seasonForDate(date = new Date()): Season {
  const m = date.getMonth(); // 0 = Jan
  return m === 11 || m === 0 || m === 1 ? "winter" : "fall";
}

export function resolveSeason(mode: MapMode, date = new Date()): Season {
  return mode === "auto" ? seasonForDate(date) : mode;
}

export function mapUrl(mode: MapMode, postals: boolean, date = new Date()): string {
  const season = resolveSeason(mode, date);
  return postals ? MAP_URLS[season].postals : MAP_URLS[season].blank;
}

const PX_PER_UNIT = Number(process.env.NEXT_PUBLIC_MAP_PX_PER_UNIT ?? "1") || 1;

// API coordinates: (0,0) is the map centre, +X right, +Z DOWN.
// Returns percentages so the marker layer scales with any zoom level.
export function toPercent(x: number, z: number): { left: number; top: number } {
  const px = MAP_SIZE / 2 + x * PX_PER_UNIT;
  const pz = MAP_SIZE / 2 + z * PX_PER_UNIT;
  return {
    left: Math.min(100, Math.max(0, (px / MAP_SIZE) * 100)),
    top: Math.min(100, Math.max(0, (pz / MAP_SIZE) * 100)),
  };
}
