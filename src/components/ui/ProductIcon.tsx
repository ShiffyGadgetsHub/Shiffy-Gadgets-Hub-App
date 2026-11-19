import {
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  Gamepad2,
  Speaker,
  Watch,
  PlugZap,
  Package,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_VISUALS: Record<string, { icon: LucideIcon; gradient: string }> = {
  Phones: { icon: Smartphone, gradient: 'from-blue-500 to-indigo-600' },
  Laptops: { icon: Laptop, gradient: 'from-slate-600 to-slate-800' },
  iPad: { icon: Tablet, gradient: 'from-sky-400 to-blue-500' },
  Headphones: { icon: Headphones, gradient: 'from-rose-400 to-pink-600' },
  PlayStation: { icon: Gamepad2, gradient: 'from-indigo-500 to-blue-700' },
  'Audio & Music Equipment': { icon: Speaker, gradient: 'from-amber-400 to-orange-600' },
  iWatch: { icon: Watch, gradient: 'from-emerald-400 to-teal-600' },
  Accessories: { icon: PlugZap, gradient: 'from-violet-400 to-purple-600' },
  Other: { icon: Package, gradient: 'from-gray-400 to-gray-600' },
};

const SIZES = {
  sm: { box: 'h-9 w-9 rounded-lg', icon: 14 },
  md: { box: 'h-11 w-11 rounded-xl', icon: 18 },
  lg: { box: 'h-16 w-16 rounded-2xl', icon: 26 },
  xl: { box: 'h-full w-full rounded-2xl', icon: 64 },
};

export default function ProductIcon({
  category,
  size = 'md',
  className = '',
}: {
  category: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const visual = CATEGORY_VISUALS[category] ?? CATEGORY_VISUALS.Other;
  const Icon = visual.icon;
  const dims = SIZES[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${visual.gradient} ${dims.box} ${className}`}
    >
      <Icon size={dims.icon} className="text-white" strokeWidth={1.8} />
    </div>
  );
}
