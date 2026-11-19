import { useState } from 'react';
import {
  Menu,
  X,
  ArrowRight,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  LifeBuoy,
  MapPin,
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  Gamepad2,
  Watch,
  Speaker,
  CheckCircle2,
  BadgeCheck,
  Handshake,
  Clock3,
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useCatalogStore } from '../store/catalogStore';
import { whatsappLink } from '../lib/whatsapp';
import logoFull from '../assets/logo-full.png';
import logoMark from '../assets/logo-mark.png';

const CATEGORY_ICONS: Record<string, typeof Smartphone> = {
  Phones: Smartphone,
  Laptops: Laptop,
  iPad: Tablet,
  Headphones: Headphones,
  PlayStation: Gamepad2,
  'Audio & Music Equipment': Speaker,
  iWatch: Watch,
};

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Genuine & Verified',
    body: 'Every device is checked and graded before it ever reaches a shelf — new or used.',
  },
  {
    icon: Sparkles,
    title: 'New & Used, Your Call',
    body: 'Buy brand new at full price, or save with a carefully graded used unit. Both covered.',
  },
  {
    icon: LifeBuoy,
    title: 'Real Support, After You Buy',
    body: "Got a question after checkout? We're a message away, not a call centre queue.",
  },
  {
    icon: MapPin,
    title: 'Local Pickup in Lagos',
    body: 'Walk in, see it, take it — or have it ready for pickup the same day.',
  },
];

const PROMISES = [
  { icon: BadgeCheck, label: 'Condition graded' },
  { icon: Handshake, label: 'Fair, upfront pricing' },
  { icon: MessageCircleMore, label: 'A real person, not a bot' },
  { icon: Clock3, label: 'Same-day response' },
];

export default function LandingPage() {
  const settings = useSettingsStore((s) => s.settings);
  const categories = useCatalogStore((s) => s.categories);
  const [navOpen, setNavOpen] = useState(false);

  const whatsappMsg = `Hi, I'd like to know more about ${settings.storeName}.`;
  const chatLink = settings.supportPhone ? whatsappLink(settings.supportPhone, whatsappMsg) : '#contact';

  const navLinks = [
    { href: '#about', label: 'About' },
    { href: '#categories', label: 'Categories' },
    { href: '#why-us', label: 'Why Us' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#171a2b]">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[#e7e8f0] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <img src={logoMark} alt="" className="h-9 w-9 object-contain" />
            <span className="text-base font-bold tracking-tight">{settings.storeName}</span>
          </a>

          <nav className="ml-auto hidden items-center gap-7 md:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-[#5b6072] transition-colors hover:text-[#171a2b]">
                {l.label}
              </a>
            ))}
          </nav>

          <a
            href={chatLink}
            target="_blank"
            rel="noreferrer"
            className="ml-auto hidden items-center gap-1.5 rounded-lg bg-[#171a2b] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 md:flex"
          >
            Chat with us
          </a>

          <button onClick={() => setNavOpen((v) => !v)} className="ml-auto rounded-lg p-2 text-[#171a2b]/80 hover:bg-black/5 md:hidden">
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {navOpen && (
          <div className="border-t border-[#e7e8f0] px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setNavOpen(false)} className="text-sm font-medium text-[#5b6072]">
                  {l.label}
                </a>
              ))}
              <a
                href={chatLink}
                target="_blank"
                rel="noreferrer"
                className="mt-1 rounded-lg bg-[#171a2b] px-4 py-2.5 text-center text-sm font-medium text-white"
              >
                Chat with us
              </a>
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        {/* Hero */}
        <section className="bg-[#f6f7fb]">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e7e8f0] bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
                <Sparkles size={13} /> Coming Soon
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-[#171a2b] sm:text-5xl lg:text-6xl">
                Genuine gadgets, new or used — your call.
              </h1>
              <p className="mt-5 max-w-md text-base text-[#5b6072] sm:text-lg">
                {settings.storeName} is putting together a straightforward way to buy phones, laptops and accessories you can trust —
                verified condition, fair pricing, real support. We're not open yet, but we're close.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#categories"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#171a2b] px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                >
                  See what's coming <ArrowRight size={16} />
                </a>
                <a
                  href={chatLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d7d9e3] bg-white px-5 py-3 text-sm font-semibold text-[#171a2b] transition-colors hover:bg-black/5"
                >
                  <MessageCircleMore size={16} /> Chat with us
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="rounded-3xl border border-[#e7e8f0] bg-white p-6 shadow-popover">
                <div className="flex items-center justify-between">
                  <img src={logoFull} alt={settings.storeName} className="h-10 w-auto object-contain" />
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-600">
                    Preview
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {Object.entries(CATEGORY_ICONS)
                    .slice(0, 6)
                    .map(([name, Icon]) => (
                      <div key={name} className="flex flex-col items-center gap-2 rounded-2xl bg-[#f6f7fb] p-4 text-center">
                        <Icon size={20} className="text-[#5b6072]" strokeWidth={1.7} />
                        <p className="text-[11px] font-medium text-[#5b6072]">{name}</p>
                      </div>
                    ))}
                </div>
                <div className="mt-5 rounded-xl border border-dashed border-[#d7d9e3] px-4 py-3 text-center text-xs text-[#9598a8]">
                  Full catalog unlocks at launch
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature strip */}
        <section id="why-us" className="border-t border-[#e7e8f0] py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex flex-col items-center text-center">
                  <f.icon size={26} className="text-[#171a2b]" strokeWidth={1.5} />
                  <h3 className="mt-3 text-sm font-semibold text-[#171a2b]">{f.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#5b6072]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Promise / detail section */}
        <section className="border-t border-[#e7e8f0] bg-[#f6f7fb] py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Built different</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#171a2b] sm:text-4xl">
                No surprises. Just gadgets that work.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#5b6072]">
                Too many gadget deals fall apart after the money's changed hands — wrong specs, hidden faults, no one to call.{' '}
                {settings.storeName} is being built to fix that.
              </p>
              <ul className="mt-6 space-y-3">
                {PROMISES.map((p) => (
                  <li key={p.label} className="flex items-center gap-3 text-sm font-medium text-[#171a2b]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card">
                      <p.icon size={16} className="text-brand-600" />
                    </span>
                    {p.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mx-auto flex w-full max-w-sm items-center justify-center rounded-3xl border border-[#e7e8f0] bg-white p-10 shadow-popover">
              <img src={logoMark} alt="" className="h-28 w-28 object-contain opacity-90" />
            </div>
          </div>
        </section>

        {/* Categories teaser */}
        <section id="categories" className="border-t border-[#e7e8f0] py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">What's coming</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#171a2b] sm:text-4xl">Find the gadget for you.</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-[#5b6072]">
                No live listings yet — this is a preview of what you'll be able to shop once we launch.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 8).map((c) => {
                const Icon = CATEGORY_ICONS[c.name] ?? Smartphone;
                const notifyLink = settings.supportPhone
                  ? whatsappLink(settings.supportPhone, `Hi, please notify me when ${c.name} is available at ${settings.storeName}.`)
                  : '#contact';
                return (
                  <div
                    key={c.id}
                    className="group flex flex-col items-center rounded-2xl border border-[#e7e8f0] bg-white p-6 text-center shadow-card transition-shadow hover:shadow-popover"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f6f7fb]">
                      <Icon size={24} className="text-[#171a2b]" strokeWidth={1.6} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#171a2b]">{c.name}</p>
                    <p className="mt-1 text-xs text-[#9598a8]">Launching soon</p>
                    <a
                      href={notifyLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 rounded-lg bg-[#171a2b] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Notify Me
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="border-t border-[#e7e8f0] bg-[#f6f7fb] py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Our story</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#171a2b] sm:text-4xl">
                A gadget store built on one idea: no surprises.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#5b6072]">
                {settings.storeName} is being built to fix the worst parts of buying used tech: every unit graded honestly, every price
                upfront, every sale backed by someone who'll actually answer when you reach out.
              </p>
              <ul className="mt-6 space-y-3">
                {['Condition graded before it is listed', 'Transparent New vs Used pricing', 'A real person on WhatsApp, not a bot'].map(
                  (item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#5b6072]">
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-[#e7e8f0] bg-white p-8 shadow-popover">
              <p className="text-5xl font-black text-[#171a2b]">Coming Soon</p>
              <p className="mt-3 text-sm text-[#5b6072]">
                We're finishing up behind the scenes so that when {settings.storeName} opens, it opens right — stocked, verified, and
                ready to go.
              </p>
              <div className="mt-6 h-px bg-[#e7e8f0]" />
              <p className="mt-6 text-sm text-[#9598a8]">Want to be first to know? Send us a message — we'll keep you posted.</p>
              <a
                href={chatLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#171a2b] px-5 py-3 text-sm font-semibold text-white"
              >
                <MessageCircleMore size={16} /> Message us on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="border-t border-[#e7e8f0] py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <img src={logoMark} alt="" className="h-8 w-8 object-contain" />
                <span className="text-sm font-bold">{settings.storeName}</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-[#9598a8]">{settings.address}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9598a8]">Get in touch</p>
              <div className="mt-3 space-y-1.5 text-sm text-[#5b6072]">
                <p>{settings.supportPhone}</p>
                <p>{settings.supportEmail}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9598a8]">Explore</p>
              <nav className="mt-3 flex flex-col gap-1.5">
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href} className="text-sm text-[#5b6072] hover:text-[#171a2b]">
                    {l.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
          <div className="mt-10 border-t border-[#e7e8f0] pt-6 text-xs text-[#9598a8]">
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
