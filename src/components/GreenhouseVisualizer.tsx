import { motion } from "motion/react";

interface GreenhouseVisualizerProps {
  stressLevel: number; // 0 to 100
  activeFlora: string; // text description
  activeStatus: string; // e.g. "Heartrate 72bpm"
}

export function GreenhouseVisualizer({ stressLevel, activeFlora, activeStatus }: GreenhouseVisualizerProps) {
  // Determine color theme based on stress level
  let primaryColor = "rgba(168, 85, 247, 0.4)"; // Purple/lavender default
  let glowShadow = "0 0 30px rgba(168, 85, 247, 0.6)"; 
  let statusText = "Stable Ecosystem (Lavender)";
  let bgGradient = "from-purple-950/20 to-slate-900";

  if (stressLevel >= 85) {
    // Crimson/crisis
    primaryColor = "rgba(239, 68, 68, 0.7)";
    glowShadow = "0 0 50px rgba(239, 68, 68, 0.9), inset 0 0 30px rgba(239, 68, 68, 0.4)";
    statusText = "CRISIS STATE - DEFENSIVE CRIMSON";
    bgGradient = "from-red-950/40 to-slate-900";
  } else if (stressLevel >= 50) {
    // Amber/warning
    primaryColor = "rgba(245, 158, 11, 0.6)";
    glowShadow = "0 0 40px rgba(245, 158, 11, 0.8)";
    statusText = "HIGH COGNITIVE TENSION - ACTIVE AMBER";
    bgGradient = "from-amber-950/30 to-slate-900";
  } else if (stressLevel >= 25) {
    // Violet/apprehension
    primaryColor = "rgba(139, 92, 246, 0.5)";
    glowShadow = "0 0 35px rgba(139, 92, 246, 0.7)";
    statusText = "APPREHENSION DETECTED - DEEP VIOLET";
    bgGradient = "from-violet-950/25 to-slate-900";
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b ${bgGradient} p-6 transition-all duration-1000 flex flex-col items-center justify-between min-h-[320px] shadow-2xl`}>
      {/* Dynamic Grid Background representing hermetic greenhouse panels */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Title */}
      <div className="w-full text-center z-10">
        <span className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
          Bio-Responsive Telemetry
        </span>
        <h3 className="font-sans text-lg font-medium text-slate-100 mt-1">
          The Smart Biosphere
        </h3>
      </div>

      {/* Interactive Glowing Orb representation of the smart greenhouse */}
      <div className="relative my-6 z-10 flex items-center justify-center">
        {/* Outer orbital rings */}
        <div className="absolute w-48 h-48 border border-slate-800 rounded-full animate-spin [animation-duration:15s]" />
        <div className="absolute w-40 h-40 border border-dashed border-slate-700 rounded-full animate-spin [animation-duration:10s] reverse" />
        
        {/* Secondary glow halo */}
        <div 
          className="absolute rounded-full transition-all duration-1000"
          style={{
            width: `${110 + stressLevel * 0.4}px`,
            height: `${110 + stressLevel * 0.4}px`,
            backgroundColor: primaryColor,
            filter: "blur(28px)",
            opacity: 0.15 + (stressLevel / 150),
          }}
        />

        {/* Central stress sphere */}
        <motion.div 
          className="relative w-28 h-28 rounded-full border border-white/20 flex flex-col items-center justify-center overflow-hidden cursor-crosshair"
          animate={{
            scale: [1, 1.03, 1],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{
            scale: {
              duration: 1.5 + (100 - stressLevel) * 0.03,
              repeat: Infinity,
              ease: "easeInOut"
            },
            rotate: {
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }
          }}
          style={{
            boxShadow: glowShadow,
            background: "radial-gradient(circle, rgba(15,23,42,0.8) 0%, rgba(2,6,23,0.95) 100%)"
          }}
        >
          {/* Inner chemical water waves shifting in frequency depending on stress */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1/2 opacity-30 transition-all duration-1000"
            style={{
              backgroundColor: primaryColor,
              filter: "blur(8px)",
              transform: `translateY(${-10 + (200 - stressLevel * 2) * 0.15}px)`
            }}
          />

          {/* Core stress level index */}
          <div className="text-center z-20">
            <span className="font-mono text-3xl font-bold text-white transition-all duration-1000" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
              {stressLevel}%
            </span>
            <p className="font-mono text-[9px] text-slate-400 mt-1">Stress idx</p>
          </div>
        </motion.div>

        {/* Moving botanical spores in greenhouse chamber */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: primaryColor,
              filter: "blur(0.5px)",
            }}
            animate={{
              x: [Math.sin(i) * 60, Math.sin(i + 1) * 75, Math.sin(i) * 60],
              y: [Math.cos(i) * 60, Math.cos(i + 1) * 75, Math.cos(i) * 60],
              opacity: [0.1, 0.7, 0.1]
            }}
            transition={{
              duration: 5 + i * 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Readouts */}
      <div className="w-full z-10 flex flex-col gap-1 text-center bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono">STRESS STATE</span>
          <span className="font-bold font-mono tracking-wide text-slate-200" style={{ color: stressLevel >= 85 ? "#ef4444" : stressLevel >= 50 ? "#f59e0b" : stressLevel >= 25 ? "#a855f7" : "#cbd5e1" }}>
            {statusText}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-1 mt-1">
          <span className="text-slate-500 font-mono">SUBTEXT METRIC</span>
          <span className="text-slate-300 font-mono">{activeStatus || "Calm - Resting"}</span>
        </div>

        <div className="flex flex-col text-left text-[10px] text-slate-400 border-t border-slate-900 pt-1 mt-1 font-sans italic leading-tight">
          <span className="text-slate-500 font-mono not-italic uppercase text-[8px] mb-0.5">Greenhouse Flora Shift</span>
          {activeFlora || "Orchids are luminous pale lavender, roots holding a calm soil water-balance."}
        </div>
      </div>
    </div>
  );
}
