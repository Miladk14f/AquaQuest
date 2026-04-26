import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

function getNextMonday() {
  const now  = new Date();
  const day  = now.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 1 ? 7 : (8 - day) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  next.setHours(7, 0, 0, 0);
  return next;
}

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    function tick() {
      const diff = getNextMonday() - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000)  / 60000);
      const s = Math.floor((diff % 60000)    / 1000);
      setTimeLeft({ d, h, m, s });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 text-teal font-semibold text-sm">
        <Clock className="w-4 h-4" />
        New quests loading now!
      </div>
    );
  }

  const Unit = ({ val, label }) => (
    <div className="text-center">
      <div className="bg-gray-900 text-white rounded-lg px-3 py-2 min-w-[48px]">
        <span className="text-xl font-bold font-mono tabular-nums">
          {String(val).padStart(2, "0")}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );

  return (
    <div className="flex items-end gap-2">
      <Clock className="w-4 h-4 text-gray-400 mb-4" />
      <Unit val={timeLeft.d} label="days" />
      <span className="text-gray-400 mb-4 font-bold">:</span>
      <Unit val={timeLeft.h} label="hrs" />
      <span className="text-gray-400 mb-4 font-bold">:</span>
      <Unit val={timeLeft.m} label="min" />
      <span className="text-gray-400 mb-4 font-bold">:</span>
      <Unit val={timeLeft.s} label="sec" />
    </div>
  );
}
