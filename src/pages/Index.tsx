/**
 * Sorcery — landing experience.
 * Cinematic hero + kinetic typography + editorial storytelling + bento capabilities.
 * Every motion honors prefers-reduced-motion (sorcery.css).
 */

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight, BrainCircuit, Calendar, BarChart3, MessageSquare, ShieldCheck,
  Sparkles, Users, Zap,
} from "lucide-react";
import { Magnetic, ParallaxLayer, Reveal, WordCascade } from "@/lib/motion";

const marqueeItems = [
  "Divine AI copy", "SMS & WhatsApp", "Scheduled campaigns", "Delivery analytics",
  "Contact intelligence", "STOP-compliant", "Template library", "Bulk personalization",
];

const capabilities = [
  {
    icon: BrainCircuit,
    title: "Divine AI generation",
    body: "Describe the intent — a flash sale, a gentle reminder, a shipping note — and receive ready-to-send copy with the right tone, length and call to action. Bring your own OpenAI, Claude, Gemini or Cohere key, or let the built-in Sorcery engine write for you.",
    span: "md:col-span-2 lg:col-span-2",
  },
  {
    icon: MessageSquare,
    title: "One studio, two channels",
    body: "SMS delivers instantly through your provider. WhatsApp opens a personal send flow per recipient.",
    span: "",
  },
  {
    icon: Users,
    title: "Contacts with memory",
    body: "Groups, tags, notes and opt-out status. Imported, exported, deduplicated — and honored at send time.",
    span: "",
  },
  {
    icon: Calendar,
    title: "Campaigns on rails",
    body: "Draft it, schedule it, pause it, duplicate it, fire it now. Cron dispatches the moment arrives — you stay in control the whole way.",
    span: "md:col-span-2",
  },
  {
    icon: BarChart3,
    title: "Truthful analytics",
    body: "Delivery rates, channel splits and category trends computed from your real message log — never invented.",
    span: "md:col-span-2 lg:col-span-2",
  },
  {
    icon: ShieldCheck,
    title: "Compliance, built-in",
    body: "Opt-out footers and STOP-awareness on by default. Keys encrypted at rest.",
    span: "",
  },
];

const journey = [
  { step: "01", title: "Write the spell", body: "Brief the AI or start from a template. Every message shows its segment count before it leaves." },
  { step: "02", title: "Choose your circle", body: "Select contacts individually or personalize a whole group in one pass." },
  { step: "03", title: "Send or schedule", body: "Dispatch this instant, or let the cron carry it to the perfect moment." },
  { step: "04", title: "Watch it land", body: "Live delivery states flow into logs and analytics as carriers confirm each hop." },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[hsl(244_24%_5%)] text-[hsl(40_20%_95%)] overflow-hidden">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[hsl(244_24%_5%)]/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-[hsl(262_83%_62%)] to-[hsl(322_76%_62%)] flex items-center justify-center shadow-glow transition-transform duration-500 group-hover:rotate-[8deg]">
              <Sparkles size={17} className="text-white" />
            </span>
            <span className="font-display font-semibold text-lg tracking-tight">Sorcery</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm text-white/60">
            <a href="#craft" className="link-draw hover:text-white transition-colors">The Craft</a>
            <a href="#capabilities" className="link-draw hover:text-white transition-colors">Capabilities</a>
            <a href="#journey" className="link-draw hover:text-white transition-colors">How it flows</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link to="/auth"><Button variant="ghost" size="sm" className="text-white/80 hover:text-white">Sign In</Button></Link>
            <Link to="/auth">
              <Magnetic strength={0.18}>
                <Button size="sm" className="bg-white text-[hsl(244_24%_5%)] hover:bg-white/90 font-medium">
                  Get Started <ArrowRight size={14} className="ml-1" />
                </Button>
              </Magnetic>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex items-center pt-16">
        {/* atmosphere */}
        <div className="aurora" aria-hidden>
          <div className="aurora__blob aurora__blob--a" />
          <div className="aurora__blob aurora__blob--b" />
          <div className="aurora__blob aurora__blob--c" />
        </div>
        <div className="veil veil--grain bg-noise" aria-hidden />
        <div className="veil veil--vignette" aria-hidden />

        {/* floating message bubbles — the signature layer */}
        <ParallaxLayer depth={18} className="hidden lg:block absolute right-[6%] top-1/2 -translate-y-1/2 w-[380px]" >
          <div className="space-y-4">
            <div className="float-bubble max-w-[300px] rounded-2xl rounded-bl-sm bg-white/[0.07] border border-white/10 backdrop-blur-md px-5 py-3.5 text-sm shadow-glass">
              Flash sale tonight — 30% off everything. Code <span className="text-[hsl(43_84%_60%)]">MOON30</span> 🌙
              <p className="text-[10px] text-white/40 mt-1.5 tabular">delivered · 1 segment</p>
            </div>
            <div className="float-bubble ml-auto max-w-[280px] rounded-2xl rounded-br-sm bg-gradient-to-br from-[hsl(262_83%_62%)]/30 to-[hsl(322_76%_62%)]/25 border border-white/15 backdrop-blur-md px-5 py-3.5 text-sm shadow-glass">
              Hi Amara — your appointment is tomorrow at 3 PM. Reply CONFIRM ✨
              <p className="text-[10px] text-white/40 mt-1.5 tabular">delivered · personalized</p>
            </div>
            <div className="float-bubble max-w-[260px] rounded-2xl rounded-bl-sm bg-white/[0.07] border border-white/10 backdrop-blur-md px-5 py-3.5 text-sm shadow-glass">
              Your order shipped! Track it anytime. Reply STOP to unsubscribe.
              <p className="text-[10px] text-white/40 mt-1.5 tabular">compliant · auto-footer</p>
            </div>
          </div>
        </ParallaxLayer>

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-8 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md text-xs text-white/70 mask-reveal"
              style={{ animationDelay: "100ms" }}
            >
              <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-[hsl(152_48%_52%)]" />
              AI-powered messaging studio
            </div>

            <h1 className="font-display font-semibold leading-[0.95] tracking-tight text-[clamp(2.8rem,8vw,5.5rem)] mb-8">
              <WordCascade text="Spread your word." startDelay={200} />
              <br />
              <span className="text-gradient italic">
                <WordCascade text="With divine precision." startDelay={520} />
              </span>
            </h1>

            <p
              className="text-lg md:text-xl text-white/60 max-w-xl mb-10 leading-relaxed mask-reveal"
              style={{ animationDelay: "900ms" }}
            >
              Sorcery composes on-brand SMS &amp; WhatsApp messages in seconds, gathers your audience,
              schedules the perfect moment, and proves every delivery — one calm, cinematic workspace.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mask-reveal" style={{ animationDelay: "1100ms" }}>
              <Link to="/auth">
                <Magnetic strength={0.22}>
                  <Button size="lg" className="bg-white text-[hsl(244_24%_5%)] hover:bg-white/90 font-medium px-8 shadow-glow">
                    Begin casting <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Magnetic>
              </Link>
              <a href="#craft">
                <Button size="lg" variant="ghost" className="text-white/70 hover:text-white border border-white/10 hover:border-white/25 transition-colors">
                  See the craft
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.35em] text-white/30 mask-reveal" style={{ animationDelay: "1500ms" }}>
          scroll
        </div>
      </section>

      {/* ── Kinetic marquee ─────────────────────────────────── */}
      <section className="relative border-y border-white/5 py-5 overflow-hidden bg-white/[0.02]">
        <div className="marquee gap-10 text-sm text-white/40 uppercase tracking-[0.25em]" aria-hidden>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap">
              {item} <Sparkles size={11} className="text-[hsl(43_84%_60%)]" />
            </span>
          ))}
        </div>
      </section>

      {/* ── The Craft — editorial split ─────────────────────── */}
      <section id="craft" className="relative py-28 md:py-40">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(43_84%_60%)] mb-5">The craft</p>
              <h2 className="font-display text-4xl md:text-5xl font-semibold leading-[1.05] mb-6">
                Messages that feel
                <span className="text-gradient italic"> written, not generated</span>
              </h2>
              <p className="text-white/55 leading-relaxed mb-6">
                Great messaging is 10% typing and 90% judgment: the right tone for this audience,
                the right length for a single segment, one clear action, and an honest opt-out.
                Sorcery encodes that judgment — then hands you the pen.
              </p>
              <ul className="space-y-3 text-sm text-white/60">
                {[
                  "Segment-aware composer — know before you send",
                  "{{name}} personalization across whole groups",
                  "Template provenance: which model wrote what",
                  "STOP-compliance applied at the moment of send",
                ].map((line, i) => (
                  <Reveal key={line} delay={i * 90} y={16}>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[hsl(262_83%_62%)] to-[hsl(43_84%_60%)] shrink-0" />
                      {line}
                    </li>
                  </Reveal>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* layered composition */}
          <ParallaxLayer depth={14} className="lg:col-span-7 relative">
            <Reveal delay={120}>
              <div className="relative mx-auto max-w-xl">
                <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[hsl(262_83%_62%)]/20 via-transparent to-[hsl(174_62%_45%)]/15 blur-2xl" aria-hidden />
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-8 shadow-glass">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Sorcery · AI brief</p>
                  <p className="text-white/80 mb-6">“Promo for our midnight drop — mysterious, a little playful, under 160 chars.”</p>
                  <div className="rounded-xl bg-gradient-to-br from-[hsl(262_83%_62%)]/25 to-[hsl(322_76%_62%)]/15 border border-white/10 p-5">
                    <p className="text-white/90 leading-relaxed">
                      The vault opens at midnight. 30% off everything that glows. Code MOONRISE. Reply YES to claim your early look.
                    </p>
                    <p className="text-[10px] text-white/40 mt-3 tabular">153 chars · 1 segment · GSM-7 · STOP appended</p>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50">variant 1</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50">variant 2</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] text-white/80">variant 3</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </ParallaxLayer>
        </div>
      </section>

      {/* ── Capabilities — bento ────────────────────────────── */}
      <section id="capabilities" className="relative py-24 md:py-32">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-2xl mb-14">
            <p className="text-xs uppercase tracking-[0.35em] text-[hsl(43_84%_60%)] mb-4">Capabilities</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-[1.05]">
              Everything the ritual needs
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {capabilities.map((cap, i) => (
              <Reveal key={cap.title} delay={i * 70} className={cap.span}>
                <div
                  className="group h-full rounded-2xl border border-white/10 bg-white/[0.04] p-7 spotlight transition-all duration-500 hover:border-white/25 hover:bg-white/[0.07] hover:-translate-y-1"
                  onMouseMove={(e) => {
                    const el = e.currentTarget;
                    const rect = el.getBoundingClientRect();
                    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
                    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
                  }}
                >
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[hsl(262_83%_62%)]/25 to-[hsl(322_76%_62%)]/15 border border-white/10 flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[6deg]">
                    <cap.icon size={19} className="text-[hsl(262_83%_72%)]" />
                  </div>
                  <h3 className="font-display text-xl font-medium mb-2.5">{cap.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{cap.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Journey ─────────────────────────────────────────── */}
      <section id="journey" className="relative py-24 md:py-32 border-t border-white/5">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-2xl mb-14">
            <p className="text-xs uppercase tracking-[0.35em] text-[hsl(43_84%_60%)] mb-4">How it flows</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-[1.05]">
              From intention to <span className="text-gradient italic">inbox</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {journey.map((j, i) => (
              <Reveal key={j.step} delay={i * 100}>
                <div className="relative h-full pt-8 border-t border-white/15">
                  <span className="absolute -top-px left-0 h-px w-14 bg-gradient-to-r from-[hsl(262_83%_62%)] to-transparent" aria-hidden />
                  <p className="font-display text-5xl font-light text-white/15 mb-4 tabular">{j.step}</p>
                  <h3 className="font-display text-xl font-medium mb-2">{j.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{j.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="relative py-32 overflow-hidden">
        <div className="aurora opacity-40" aria-hidden>
          <div className="aurora__blob aurora__blob--a" />
          <div className="aurora__blob aurora__blob--b" />
        </div>
        <div className="veil veil--grain bg-noise" aria-hidden />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <Reveal>
            <h2 className="font-display text-5xl md:text-7xl font-semibold leading-[1] mb-8">
              Ready to make
              <br />
              <span className="text-gradient italic">words travel?</span>
            </h2>
            <p className="text-white/55 max-w-xl mx-auto mb-10">
              Free trial includes 500 messages — sandbox delivery and the Sorcery engine included,
              so the magic works before you ever paste a key.
            </p>
            <Link to="/auth">
              <Magnetic strength={0.25}>
                <Button size="lg" className="bg-white text-[hsl(244_24%_5%)] hover:bg-white/90 font-medium px-10 py-7 text-base shadow-glow">
                  Open the studio <Zap className="ml-2 h-4 w-4" />
                </Button>
              </Magnetic>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(262_83%_62%)] to-[hsl(322_76%_62%)] flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </span>
            <span className="font-display font-semibold">Sorcery</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/40">
            <a href="#capabilities" className="link-draw hover:text-white/80 transition-colors">Capabilities</a>
            <a href="#journey" className="link-draw hover:text-white/80 transition-colors">How it flows</a>
            <Link to="/auth" className="link-draw hover:text-white/80 transition-colors">Sign in</Link>
          </div>
          <p className="text-sm text-white/30">© {new Date().getFullYear()} Sorcery. Words, delivered.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
