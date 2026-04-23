import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const PHRASES = [
  "Cuidado humano, tecnologia precisa.",
  "Cada sorriso, uma história bem cuidada.",
  "Aracruz · Espírito Santo",
  "Excelência clínica, todos os dias.",
];

export default function LoginAside() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PHRASES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-none lg:rounded-r-[2.5rem] bg-[hsl(var(--surface-dark))]">
      {/* Gradiente base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, hsl(215 80% 35% / 0.55), transparent 55%), radial-gradient(ellipse at 80% 90%, hsl(215 70% 40% / 0.35), transparent 60%), linear-gradient(180deg, hsl(222 35% 8%), hsl(222 35% 5%))",
        }}
      />

      {/* Blobs animados (sutis, sem neon) */}
      <motion.div
        aria-hidden
        className="absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, hsl(215 80% 50% / 0.55), transparent 70%)", filter: "blur(40px)" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-0 right-0 h-96 w-96 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, hsl(215 70% 60% / 0.45), transparent 70%)", filter: "blur(60px)" }}
        animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100% / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 flex h-full flex-col justify-between p-8 sm:p-12 text-white">
        <div className="flex items-center gap-2 text-white/80">
          <div className="h-9 w-9 grid place-items-center rounded-xl bg-white/10 backdrop-blur border border-white/15">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-lg tracking-wide">Clínica Levii</span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60 mb-3">Painel administrativo</p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
            Gestão completa da<br />sua clínica em um só lugar.
          </h1>

          <div className="mt-8 h-7 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-white/70"
              >
                {PHRASES[idx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Conexão segura
          </div>
          <div>v1.0 · Levii Cloud</div>
        </div>
      </div>
    </div>
  );
}
