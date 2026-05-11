import Image from 'next/image';

export function TimerVisual() {
  return (
    <div
      className="rounded-[20px] overflow-hidden relative"
      style={{ height: 240 }}
    >
      <Image
        src="/feature-timer.jpg"
        alt="Horae ring with the Start button"
        fill
        sizes="(max-width: 768px) 100vw, 400px"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />
    </div>
  );
}
