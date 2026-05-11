import Image from 'next/image';

type Props = { size?: number; className?: string };

export function Logo({ size = 20, className }: Props) {
  const iconSize = Math.round(size * 1.4);
  return (
    <span
      className={`inline-flex items-center ${className ?? ''}`}
      style={{ gap: size * 0.4 }}
    >
      <Image
        src="/icon.png"
        alt=""
        width={iconSize}
        height={iconSize}
        priority
        style={{
          borderRadius: iconSize * 0.22,
          display: 'block',
        }}
      />
      <span
        className="font-display font-extrabold tracking-tight text-on-surface"
        style={{ fontSize: size, letterSpacing: '-0.02em' }}
      >
        horae
      </span>
    </span>
  );
}
