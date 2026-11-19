import { initials } from '../../lib/format';

export default function Avatar({ name, src, size = 36 }: { name: string; src?: string; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-semibold text-white"
    >
      {initials(name)}
    </div>
  );
}
