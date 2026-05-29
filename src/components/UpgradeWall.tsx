import { motion } from "motion/react";
import { Lock, CheckCircle, LogOut, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PAYMENT_URL = "#";

const PLANS = [
  {
    id: "playwright",
    label: "SCRIPT ONLY",
    name: "Playwright",
    price: "$19",
    memberPrice: "$14",
    interval: "mo",
    desc: "Idea to finished screenplay — no visual generation.",
    features: [
      "3 full productions/month",
      "Unlimited story directions",
      "Script export (PDF)",
      "Phases 1 – 3 only",
    ],
    excluded: ["Character reference grids", "Shot generation", "Video promotions"],
    cta: "Start Writing →",
    ctaStyle: "outline" as const,
    accent: "blue",
    border: "border-blue-500/25",
    accentText: "text-blue-400",
    accentBg: "bg-blue-500/10",
    highlight: false,
  },
  {
    id: "director",
    label: "MOST POPULAR",
    name: "Director",
    price: "$49",
    memberPrice: "$39",
    interval: "mo",
    desc: "Full pipeline from screenplay to storyboard & video.",
    features: [
      "3 productions/month incl. visuals",
      "15 character reference grids",
      "30 shot generations (image)",
      "10 video promotions (Seedance 2.0)",
      "ElevenLabs audio per character",
    ],
    excluded: [],
    cta: "Start Directing →",
    ctaStyle: "orange" as const,
    accent: "orange",
    border: "border-[#FF3D00]/50",
    accentText: "text-[#FF3D00]",
    accentBg: "bg-[#FF3D00]/8",
    highlight: true,
  },
  {
    id: "studio",
    label: "PRODUCTION HOUSE",
    name: "Studio",
    price: "$149",
    memberPrice: "$119",
    interval: "mo",
    desc: "Unlimited output. Commercial rights. Priority queue.",
    features: [
      "Unlimited screenplay productions",
      "50 character reference grids",
      "150 shot generations",
      "50 video promotions",
      "Priority generation queue",
      "Commercial rights on all output",
    ],
    excluded: [],
    cta: "Open the Studio →",
    ctaStyle: "white" as const,
    accent: "white",
    border: "border-white/25",
    accentText: "text-white",
    accentBg: "bg-white/5",
    highlight: false,
  },
];

export function UpgradeWall() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-start px-4 py-16 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mx-auto">
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Unlock the Playbook</h1>
          <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-sm">
            Choose a plan to access the Screenwriting Playbook. Cancel anytime.
          </p>
        </div>

        {/* Member pricing banner */}
        <div className="text-center">
          <p className="text-[11px] font-mono text-amber-400/80">
            Already an Infinite Studio member? You qualify for member pricing.{" "}
            <a href="#" className="underline hover:text-amber-300 transition-colors">Sign in to apply.</a>
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className={`relative rounded-2xl border ${plan.border} ${plan.accentBg} p-6 flex flex-col gap-5 ${
                plan.highlight ? "ring-1 ring-[#FF3D00]/30 shadow-xl shadow-orange-950/20" : ""
              }`}
            >
              {/* Badge */}
              <div className={`inline-flex w-fit items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest border ${
                plan.highlight
                  ? "bg-[#FF3D00]/15 border-[#FF3D00]/30 text-[#FF3D00]"
                  : plan.accent === "blue"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "bg-white/8 border-white/15 text-slate-400"
              }`}>
                {plan.highlight && <Zap className="w-2.5 h-2.5" />}
                {plan.label}
              </div>

              {/* Name + price */}
              <div>
                <h2 className={`text-xl font-bold ${plan.accentText}`}>{plan.name}</h2>
                <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-white">{plan.price}<span className="text-sm font-normal text-slate-400">/{plan.interval}</span></span>
                  <span className="text-[10px] font-mono text-amber-400/70 bg-amber-400/8 border border-amber-400/15 rounded px-1.5 py-0.5">
                    member {plan.memberPrice}/{plan.interval}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{plan.desc}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-slate-300">
                    <CheckCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${plan.accentText}`} />
                    {f}
                  </li>
                ))}
                {plan.excluded.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-slate-600 line-through">
                    <div className="w-3.5 h-3.5 mt-0.5 shrink-0 rounded-full border border-slate-700 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={PAYMENT_URL}
                className={`block w-full text-center py-2.5 rounded-lg text-sm font-mono font-bold transition-all cursor-pointer ${
                  plan.ctaStyle === "orange"
                    ? "bg-[#FF3D00] hover:bg-[#e63600] text-white"
                    : plan.ctaStyle === "white"
                    ? "bg-white hover:bg-slate-100 text-black"
                    : "border border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Credit pack note */}
        <div className="text-center">
          <p className="text-[10px] font-mono text-slate-600">
            Need more credits mid-production?{" "}
            <a href={PAYMENT_URL} className="text-slate-500 hover:text-slate-300 transition-colors underline">
              Top up with a credit pack
            </a>
            {" "}— $9 for 5 shot generations or 1 character grid.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-2 border-t border-white/5">
          <p className="text-[11px] text-slate-600 font-mono">
            Already subscribed? Sign in with your Studio account to access.
          </p>
          {user && (
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              Sign out ({user.email})
            </button>
          )}
        </div>

        {/* Brand footer */}
        <div className="text-center pb-4">
          <p className="text-[9px] font-mono text-slate-700">
            A product of Infinite Studio AI ·{" "}
            <a href="https://infinitestudioai.com" target="_blank" rel="noreferrer" className="hover:text-slate-500 transition-colors">
              infinitestudioai.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
