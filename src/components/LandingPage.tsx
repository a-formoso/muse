import { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Film, Zap, Sun, Moon } from "lucide-react";
import { AuthModal } from "./AuthModal";
import { useTheme } from "../context/ThemeContext";

interface LandingPageProps {
  onAuthenticated: () => void;
}

const FEATURES = [
  {
    icon: Film,
    title: "Beat Architecture",
    desc: "McKee-compliant structural design. Acts, sequences, and subtextual beats built to production standard.",
  },
  {
    icon: Sparkles,
    title: "Claude Story Intelligence",
    desc: "Claude Opus 4.8 drives every narrative phase — from cosmology to character to cinematic script.",
  },
  {
    icon: Zap,
    title: "Seedance 2.0 Shot Production",
    desc: "Higgsfield's Seedance model renders your storyboard shots as images and cinematic video clips.",
  },
];

export function LandingPage({ onAuthenticated }: LandingPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"signin" | "signup">("signin");
  const { theme, toggle: toggleTheme } = useTheme();

  const openSignIn = () => { setModalMode("signin"); setModalOpen(true); };
  const openSignUp = () => { setModalMode("signup"); setModalOpen(true); };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "var(--bg-app)", color: "var(--text-base)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 backdrop-blur-sm" style={{ borderBottom: "1px solid var(--border-faint)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#FF3D00] rounded-sm flex items-center justify-center font-bold text-white text-xs tracking-tighter">IS</div>
          <div>
            <h1 className="text-xs font-bold tracking-widest uppercase text-white leading-none">Infinite Studio</h1>
            <p className="text-[9px] text-[#FF3D00] uppercase tracking-widest leading-none mt-0.5">Muse</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark"
              ? <Sun className="w-3.5 h-3.5 text-slate-400" />
              : <Moon className="w-3.5 h-3.5 text-slate-400" />
            }
          </button>
          <button
            onClick={openSignIn}
            className="text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-[#FF3D00] rounded-full animate-pulse" />
            Screenwriting Playbook v4.1
          </div>

          <h2 className="text-5xl sm:text-6xl font-bold leading-none tracking-tight text-white">
            Your Production.<br />
            Your Pipeline.<br />
            <span className="text-[#FF3D00]">One Studio.</span>
          </h2>

          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            From idea to screenplay to shot list — powered by Anthropic's Claude and ByteDance.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={openSignIn}
              className="px-8 py-3.5 rounded-lg border border-white/25 text-sm font-mono font-bold text-white hover:border-white/50 hover:bg-white/5 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={openSignUp}
              className="px-8 py-3.5 rounded-lg bg-[#FF3D00] hover:bg-[#e63600] text-sm font-mono font-bold text-white transition-all cursor-pointer shadow-lg shadow-orange-950/50"
            >
              Start Free
            </button>
          </div>
        </motion.div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 * i }}
              className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-3 hover:border-white/15 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#FF3D00]/10 border border-[#FF3D00]/20 flex items-center justify-center">
                <f.icon className="w-4 h-4 text-[#FF3D00]" />
              </div>
              <h3 className="font-bold text-white text-sm">{f.title}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-4 flex items-center justify-between text-[10px] font-mono text-slate-600" style={{ borderTop: "1px solid var(--border-faint)" }}>
        <span className="text-slate-700">© 2026 Infinite Studio AI. All rights nominal.</span>
        <span>A product of Infinite Studio AI · <a href="https://infinitestudioai.com" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">infinitestudioai.com</a></span>
      </footer>

      <AuthModal
        open={modalOpen}
        initialMode={modalMode}
        onClose={() => setModalOpen(false)}
        onAuthenticated={onAuthenticated}
      />
    </div>
  );
}
