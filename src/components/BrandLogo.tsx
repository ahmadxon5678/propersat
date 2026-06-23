import Image from "next/image";

export function BrandLogo({
  size = 44,
  showText = true,
  textClassName = "text-blue-950",
  subtitle,
  className = "",
}: {
  size?: number;
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
  className?: string;
}) {
  const imageSize = Math.round(size * 0.84);

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm"
        style={{ width: size, height: size }}
      >
        <Image
          src="/proper-sat-logo.svg"
          alt="Proper SAT Prep logo"
          width={imageSize}
          height={imageSize}
          className="block object-contain"
          priority
        />
      </span>
      {showText ? (
        <span>
          <span className={`block font-black leading-tight ${textClassName}`}>Proper SAT Prep</span>
          {subtitle ? <span className="block text-xs font-semibold leading-tight text-blue-200">{subtitle}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
