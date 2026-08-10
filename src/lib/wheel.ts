export interface WheelSegment {
  gems: number;
  color: string;
  label: string;
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  { gems: 5, color: "#64748b", label: "+5" },
  { gems: 15, color: "#3b82f6", label: "+15" },
  { gems: 10, color: "#06b6d4", label: "+10" },
  { gems: 50, color: "#a855f7", label: "+50" },
  { gems: 20, color: "#22c55e", label: "+20" },
  { gems: 100, color: "#f59e0b", label: "+100" },
  { gems: 10, color: "#06b6d4", label: "+10" },
  { gems: 250, color: "#ef4444", label: "+250!" },
];

export function spinWheel(): { segment: WheelSegment; index: number; angle: number } {
  const index = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
  const segment = WHEEL_SEGMENTS[index];
  const segmentAngle = 360 / WHEEL_SEGMENTS.length;
  const angle = 360 * 5 + segmentAngle * index + segmentAngle / 2;
  return { segment, index, angle };
}
