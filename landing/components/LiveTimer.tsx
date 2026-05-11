'use client';

import { useEffect, useState } from 'react';

type Props = {
  /** Starting seconds offset. e.g. 6*60+56 → 6:56 */
  startSeconds?: number;
  /** Render as h:mm:ss instead of mm:ss. */
  withHours?: boolean;
  className?: string;
};

export function LiveTimer({
  startSeconds = 6 * 60 + 56,
  withHours = false,
  className,
}: Props) {
  const [s, setS] = useState(startSeconds);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = setInterval(() => setS((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSeconds = s;
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const text = withHours
    ? `${hh}:${pad(mm)}:${pad(ss)}`
    : `${mm}:${pad(ss)}`;

  return (
    <span className={`tabular-nums ${className ?? ''}`}>{text}</span>
  );
}
