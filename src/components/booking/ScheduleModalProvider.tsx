import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import ScheduleModal from "./ScheduleModal";

type Ctx = {
  open: (treatmentSlug?: string) => void;
  close: () => void;
};

const ScheduleModalContext = createContext<Ctx | null>(null);

export function useScheduleModal() {
  const ctx = useContext(ScheduleModalContext);
  if (!ctx) throw new Error("useScheduleModal precisa estar dentro de ScheduleModalProvider");
  return ctx;
}

export function ScheduleModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<string | undefined>(undefined);

  const open = useCallback((treatmentSlug?: string) => {
    setPreset(treatmentSlug);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ScheduleModalContext.Provider value={{ open, close }}>
      {children}
      <ScheduleModal open={isOpen} onOpenChange={setIsOpen} presetTreatment={preset} />
    </ScheduleModalContext.Provider>
  );
}
