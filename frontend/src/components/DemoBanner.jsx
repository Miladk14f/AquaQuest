import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="bg-amber-light border-b border-amber px-4 py-2.5">
      <div className="max-w-screen-xl mx-auto flex items-center gap-2 text-amber-dark text-sm">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>Demo mode</strong> — showing sample data. Fill in your API keys in{" "}
          <code className="bg-amber/20 px-1 rounded text-xs">.env</code> to connect live satellite data.
        </span>
      </div>
    </div>
  );
}
