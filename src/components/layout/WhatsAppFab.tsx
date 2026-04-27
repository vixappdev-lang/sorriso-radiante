import { CLINIC_INFO } from "@/data/clinic";
import { useClinicName } from "@/hooks/useClinicBrand";

export default function WhatsAppFab() {
  const phone = CLINIC_INFO.whatsapp.number;
  const clinicName = useClinicName();
  const text = encodeURIComponent(`Olá! Gostaria de informações sobre tratamentos na ${clinicName}.`);
  return (
    <a
      href={`https://wa.me/${phone}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 group"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
      <span className="relative grid place-items-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#25D366] text-white shadow-elegant transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.5 0 .2 5.3.2 11.85a11.78 11.78 0 0 0 1.6 5.94L0 24l6.36-1.66a11.84 11.84 0 0 0 5.69 1.45h.01c6.54 0 11.84-5.3 11.84-11.85 0-3.16-1.23-6.13-3.38-8.46Zm-3.07 14.27c-.25.69-1.45 1.32-2 1.4-.5.07-1.13.1-1.82-.12-.42-.13-.96-.31-1.65-.61-2.91-1.25-4.8-4.17-4.95-4.37-.15-.2-1.18-1.59-1.18-3.02s.74-2.13 1-2.43c.27-.3.57-.37.77-.37l.56.01c.18 0 .42-.07.66.5.25.58.84 2.03.91 2.18.07.15.12.32.02.52-.1.2-.15.33-.3.5-.15.16-.32.37-.45.5-.15.14-.3.3-.13.6.18.3.77 1.26 1.65 2.04 1.13 1.01 2.08 1.32 2.38 1.47.3.15.47.13.63-.07.17-.2.73-.86.93-1.16.2-.3.4-.25.66-.15.27.1 1.72.81 2.02.96.3.14.5.22.57.34.08.13.08.71-.17 1.4Z"/>
        </svg>
      </span>
    </a>
  );
}
