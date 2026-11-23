import { GrowFill } from "@mono/ui";
import { cn } from "@mono/utils";

/** Progress bar + percent. `@mono/ui` has no progress primitive; the fill is its `GrowFill`. */
export function ProjectProgress({ value, className }: { value: number; className?: string }) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progres"
        className="relative h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <GrowFill pct={percent} className="absolute inset-y-0 left-0 rounded-full bg-primary" />
      </div>
      <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        {percent}%
      </span>
    </div>
  );
}
