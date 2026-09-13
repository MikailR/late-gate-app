import { formatClock, scheduledMinutesFor } from "@/lib/domain/schedule";
import type { StubProduct } from "@/lib/domain/types";

export type LiveRow = { key: string; value: string };

type RowSpec = { at: number; key: string; value: string };

/**
 * Demo event log for the tracker. `at` is the fraction of the way to the
 * final lateness at which the row prints.
 */
export function liveRowsFor(product: StubProduct, dest: string, progress: number, finalLateMinutes: number): LiveRow[] {
  const scheduled = scheduledMinutesFor(product);
  const rows: RowSpec[] =
    product === "takeoff"
      ? [
          { at: 0, key: "AT GATE", value: "C112" },
          { at: 0.25, key: "DOOR CLOSED", value: "WAITING" },
          { at: 0.5, key: "PUSHBACK HOLD", value: "+18" },
          { at: 0.8, key: "TAXI QUEUE", value: "LONG" },
          { at: 1, key: "WHEELS UP", value: formatClock(scheduled + finalLateMinutes) },
        ]
      : [
          { at: 0, key: "PUSHED BACK", value: "18:39 +34" },
          { at: 0, key: "WHEELS UP", value: "18:58" },
          { at: 0.3, key: "CRUISING FL360", value: "HEADWIND" },
          { at: 0.55, key: /^(NRT|HND)$/.test(dest) ? "MID PACIFIC" : "OVER DENVER", value: "SLOWING" },
          { at: 0.8, key: "DESCENT", value: "SEQUENCED" },
          { at: 1, key: "AT GATE", value: "F84" },
        ];
  return rows.filter((row) => row.at <= progress + 0.001).map(({ key, value }) => ({ key, value }));
}
