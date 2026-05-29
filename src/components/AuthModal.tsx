import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface AuthModalProps {
  open: boolean;
  initialMode: "signin" | "signup";
  onClose: () => void;
  onAuthenticated: () => void;
}

export function AuthModal({ open, initialMode, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Re-sync mode whenever the modal opens with a new initialMode
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  const reset = () => {
    setError(null); setInfo(null);
    setEmail(""); setPassword(""); setConfirmPassword("");
    setShowPass(false); setLoading(false);
  };

  const switchMode = (m: "signin" | "signup") => { reset(); setMode(m); };

  const handleSignIn = async () => {
    setError(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    onAuthenticated();
    onClose();
    reset();
  };

  const handleSignUp = async () => {
    setError(null);
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setLoading(false); setError(error.message); return; }

    // Insert user_profiles row
    if (data.user) {
      await supabase.from("user_profiles").upsert({
        id: data.user.id,
        email: data.user.email,
        created_at: new Date().toISOString(),
        studio_trial_used: false,
      }, { onConflict: "id" });
    }

    setLoading(false);
    if (data.session) {
      onAuthenticated();
      onClose();
      reset();
    } else {
      setInfo("Check your email to confirm your account, then sign in.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email address first."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setInfo("Password reset email sent. Check your inbox.");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { onClose(); reset(); } }}
        >
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-sm bg-[#0f0f12] border border-white/12 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
              <div>
                <h2 className="text-sm font-bold text-white">
                  {mode === "signin" ? "Sign In" : "Create Account"}
                </h2>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {mode === "signin" ? "Access your production pipeline." : "Start your free trial production."}
                </p>
              </div>
              <button onClick={() => { onClose(); reset(); }} className="text-slate-600 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (mode === "signin" ? handleSignIn() : handleSignUp())}
                  placeholder="you@example.com"
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#FF3D00]/50 font-mono"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (mode === "signin" ? handleSignIn() : undefined)}
                    placeholder="••••••••"
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#FF3D00]/50 font-mono"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm password (signup only) */}
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Confirm Password</label>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSignUp()}
                    placeholder="••••••••"
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#FF3D00]/50 font-mono"
                    autoComplete="new-password"
                  />
                </div>
              )}

              {/* Error / Info */}
              {error && (
                <p className="text-[11px] text-red-400 font-mono bg-red-950/20 border border-red-800/30 rounded-lg px-3 py-2">{error}</p>
              )}
              {info && (
                <p className="text-[11px] text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-800/30 rounded-lg px-3 py-2">{info}</p>
              )}

              {/* CTA */}
              <button
                onClick={mode === "signin" ? handleSignIn : handleSignUp}
                disabled={loading || !email || !password}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#FF3D00] hover:bg-[#e63600] disabled:opacity-50 text-sm font-mono font-bold text-white transition-all cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {mode === "signin" ? "Sign In" : "Create Account"}
              </button>

              {/* Forgot password */}
              {mode === "signin" && (
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="w-full text-center text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Toggle */}
            <div className="px-6 pb-5 border-t border-white/8 pt-4 flex items-center justify-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500">
                {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button
                onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                className="text-[10px] font-mono text-[#FF3D00] hover:text-orange-400 transition-colors cursor-pointer font-bold"
              >
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
