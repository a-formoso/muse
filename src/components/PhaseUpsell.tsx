import { motion } from "motion/react";
import { Lock, Zap, CheckCircle } from "lucide-react";

const PAYMENT_URL = "#";

interface PhaseUpsellProps {
  currentPhase: number;
}

export function PhaseUpsell({ currentPhase }: PhaseUpsellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center min-h-[400px] py-12 px-6"
    >
      <div className="w-full max-w-lg space-y-6 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FF3D00]/10 border border-[#FF3D00]/20 mx-auto">
          <Lock className="w-6 h-6 text-[#FF3D00]" />
        </div>

        {/* Copy */}
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">
            Phase {String(currentPhase).padStart(2, "0")} · Requires Upgrade
          </p>
          <h2 className="text-2xl font-bold text-white tracking-tight">Visual Generation</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
            Your Playwright plan covers Phases 1–3. To generate character visuals, storyboard shots, and video promotions, upgrade to Director or Studio.
          </p>
        </div>

        {/* Two upgrade cards */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {/* Director */}
          <div className="rounded-xl border border-[#FF3D00]/40 bg-[#FF3D00]/5 p-4 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3 h-3 text-[#FF3D00]" />
                <span className="text-[9px] font-mono text-[#FF3D00] uppercase tracking-widest font-bold">Director</span>
              </div>
              <p className="text-lg font-bold text-white">$49<span className="text-xs font-normal text-slate-400">/mo</span></p>
              <p className="text-[9px] font-mono text-amber-400/70 mt-0.5">member: $39/mo</p>
            </div>
            <ul className="space-y-1.5">
              {["15 character grids", "30 shot generations", "10 video promotions"].map(f => (
                <li key={f} className="flex items-start gap-1.5 text-[10px] text-slate-300">
                  <CheckCircle className="w-3 h-3 text-[#FF3D00] mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={PAYMENT_URL}
              className="block w-full text-center py-2 rounded-lg bg-[#FF3D00] hover:bg-[#e63600] text-[11px] font-mono font-bold text-white transition-all"
            >
              Upgrade →
            </a>
          </div>

          {/* Studio */}
          <div className="rounded-xl border border-white/15 bg-white/4 p-4 space-y-3">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block mb-1">Studio</span>
              <p className="text-lg font-bold text-white">$149<span className="text-xs font-normal text-slate-400">/mo</span></p>
              <p className="text-[9px] font-mono text-amber-400/70 mt-0.5">member: $119/mo</p>
            </div>
            <ul className="space-y-1.5">
              {["Unlimited productions", "50 character grids", "150 shots + 50 videos"].map(f => (
                <li key={f} className="flex items-start gap-1.5 text-[10px] text-slate-300">
                  <CheckCircle className="w-3 h-3 text-white mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={PAYMENT_URL}
              className="block w-full text-center py-2 rounded-lg bg-white hover:bg-slate-100 text-[11px] font-mono font-bold text-black transition-all"
            >
              Go Pro →
            </a>
          </div>
        </div>

        <p className="text-[9px] font-mono text-slate-600">
          Your Phase 1–3 work is saved and will carry over when you upgrade.
        </p>
      </div>
    </motion.div>
  );
}
