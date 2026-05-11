import Image from 'next/image';

export function GoalVisual() {
  return (
    <div
      className="rounded-[20px] overflow-hidden relative"
      style={{ height: 240 }}
    >
      <Image
        src="/feature-goals.jpg"
        alt="Actual vs ideal goal comparison"
        fill
        sizes="(max-width: 768px) 100vw, 400px"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />
    </div>
  );
}
