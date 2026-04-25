import { useEffect, useState } from 'react';

export default function AudioVisualizer({ active }: { active: boolean }) {
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 32 }, () => 0.3));

  useEffect(() => {
    if (!active) {
      setBars(Array.from({ length: 32 }, () => 0.15));
      return;
    }
    const id = window.setInterval(() => {
      setBars(Array.from({ length: 32 }, () => 0.25 + Math.random() * 0.75));
    }, 120);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <div className="flex items-end justify-between gap-[3px] h-24 px-2">
      {bars.map((h, i) => {
        const hue = 280 + (i / bars.length) * 80;
        return (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-150 ease-out"
            style={{
              height: `${h * 100}%`,
              minHeight: '6px',
              background: `linear-gradient(to top, hsl(${hue}, 95%, 55%), hsl(${hue + 30}, 95%, 70%))`,
              boxShadow: active ? `0 0 8px hsla(${hue}, 95%, 60%, 0.6)` : 'none',
            }}
          />
        );
      })}
    </div>
  );
}
