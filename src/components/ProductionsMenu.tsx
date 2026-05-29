import { useState, useEffect, useRef } from "react";
import { Folder, ChevronDown, Clock, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { listProductions, deleteProduction, type Production } from "../lib/productions";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS: Record<string, string> = {
  discovery: "01 Discovery",
  blueprint: "02 Blueprint",
  screenplay: "03 Screenplay",
  visuals: "04 Visuals",
  shots: "05 Shots",
  assembly: "06 Assembly",
};

const STATUS_COLORS: Record<string, string> = {
  discovery: "text-slate-400",
  blueprint: "text-blue-400",
  screenplay: "text-violet-400",
  visuals: "text-amber-400",
  shots: "text-orange-400",
  assembly: "text-emerald-400",
};

interface ProductionsMenuProps {
  onResume: (production: Production) => void;
  onNew: () => void;
}

export function ProductionsMenu({ onResume, onNew }: ProductionsMenuProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      listProductions(user.id).then(p => { setProductions(p); setLoading(false); });
    }
  }, [open, user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    await deleteProduction(user.id, id);
    setProductions(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
        title="My Productions"
      >
        <Folder className="w-3.5 h-3.5 text-slate-400" />
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 w-64 bg-[#0f0f13] border border-white/12 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-3 py-2.5 border-b border-white/8 flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">My Productions</span>
              <button
                onClick={() => { onNew(); setOpen(false); }}
                className="flex items-center gap-1 text-[9px] font-mono text-[#FF3D00] hover:text-orange-400 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                New
              </button>
            </div>

            {loading ? (
              <div className="px-3 py-4 text-center text-[10px] font-mono text-slate-600">Loading…</div>
            ) : productions.length === 0 ? (
              <div className="px-3 py-4 text-center text-[10px] font-mono text-slate-600">No saved productions yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {productions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onResume(p); setOpen(false); }}
                    className="w-full flex items-start justify-between gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer group text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">
                        {p.title || "Untitled Production"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-mono ${STATUS_COLORS[p.status] ?? "text-slate-500"}`}>
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                        <span className="text-[9px] font-mono text-slate-700">·</span>
                        <span className="text-[9px] font-mono text-slate-600 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(p.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={e => handleDelete(e, p.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400 cursor-pointer shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
