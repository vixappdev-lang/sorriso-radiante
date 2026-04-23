import { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function PageHero({ eyebrow, title, subtitle, children }: Props) {
  return (
    <section className="relative pt-28 sm:pt-36 pb-12 sm:pb-16 bg-soft border-b border-border/60">
      <div className="container-edge">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="max-w-3xl"
        >
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="mt-3 font-display font-semibold text-balance" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 1.1 }}>
            {title}
          </h1>
          {subtitle && <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">{subtitle}</p>}
          {children && <div className="mt-6">{children}</div>}
        </motion.div>
      </div>
    </section>
  );
}
