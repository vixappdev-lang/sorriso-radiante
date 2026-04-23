import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, MapPin, Phone, Clock } from "lucide-react";
import { useState } from "react";
import LocationModal from "./LocationModal";

export default function Footer() {
  const year = new Date().getFullYear();
  const [locOpen, setLocOpen] = useState(false);
  return (
    <footer className="bg-surface-dark text-surface-dark-foreground">
      <div className="container-edge py-14 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-white/10 border border-white/15">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5c-2.5 0-4 2-4 4.5 0 3 1.5 5 2 8 .3 1.6 1 3.5 2.5 3.5 1.3 0 1.7-1.5 2.5-3 .5-1 1-1.5 2-1.5s1.5.5 2 1.5c.8 1.5 1.2 3 2.5 3 1.5 0 2.2-1.9 2.5-3.5.5-3 2-5 2-8 0-2.5-1.5-4.5-4-4.5-1.7 0-2.7.9-3.5 1.6-.7.6-1 .9-1.5.9s-.8-.3-1.5-.9C9.7 4.4 8.7 3.5 7 3.5Z"/>
                </svg>
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-lg font-semibold">Clínica Levii</span>
                <span className="text-[10px] uppercase tracking-[0.22em] font-semibold text-white/60">Odontologia</span>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-white/70 max-w-xs">
              Cuidado odontológico de excelência em Aracruz/ES: tecnologia de ponta, atendimento humano e resultados que duram.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a aria-label="Instagram" href="#" className="grid place-items-center h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-smooth">
                <Instagram className="h-4 w-4" />
              </a>
              <a aria-label="Facebook" href="#" className="grid place-items-center h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-smooth">
                <Facebook className="h-4 w-4" />
              </a>
              <a aria-label="WhatsApp" href="https://wa.me/5527999990000" className="grid place-items-center h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-smooth">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.5 0 .2 5.3.2 11.85a11.78 11.78 0 0 0 1.6 5.94L0 24l6.36-1.66a11.84 11.84 0 0 0 5.69 1.45h.01c6.54 0 11.84-5.3 11.84-11.85 0-3.16-1.23-6.13-3.38-8.46Z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold mb-4 text-white">Atendimento</h3>
            <ul className="space-y-3 text-sm text-white/75">
              <li className="flex items-start gap-2.5"><Phone className="h-4 w-4 mt-0.5 text-primary-glow" /> (27) 3256-0000</li>
              <li className="flex items-start gap-2.5"><svg viewBox="0 0 24 24" className="h-4 w-4 mt-0.5 text-primary-glow shrink-0" fill="currentColor" aria-hidden><path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.5 0 .2 5.3.2 11.85a11.78 11.78 0 0 0 1.6 5.94L0 24l6.36-1.66a11.84 11.84 0 0 0 5.69 1.45h.01c6.54 0 11.84-5.3 11.84-11.85 0-3.16-1.23-6.13-3.38-8.46Z"/></svg>(27) 99999-0000 — WhatsApp</li>
              <li className="flex items-start gap-2.5"><Mail className="h-4 w-4 mt-0.5 text-primary-glow" /> contato@clinicalevii.com.br</li>
              <li className="flex items-start gap-2.5"><Clock className="h-4 w-4 mt-0.5 text-primary-glow" /> Seg–Sex 8h–19h • Sáb 8h–13h</li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold mb-4 text-white">Navegação</h3>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li><Link to="/sobre" className="link-underline hover:text-white">Sobre a clínica</Link></li>
              <li><Link to="/tratamentos" className="link-underline hover:text-white">Tratamentos</Link></li>
              <li><Link to="/equipe" className="link-underline hover:text-white">Equipe</Link></li>
              <li><Link to="/tecnologia" className="link-underline hover:text-white">Tecnologia</Link></li>
              <li><Link to="/galeria" className="link-underline hover:text-white">Galeria</Link></li>
              <li><Link to="/servicos" className="link-underline hover:text-white">Serviços e preços</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold mb-4 text-white">Endereço</h3>
            <p className="text-sm text-white/75 leading-relaxed flex items-start gap-2.5">
              <MapPin className="h-4 w-4 mt-0.5 text-primary-glow shrink-0" />
              <span>
                Av. Venâncio Flores, 350 — Sala 04<br/>
                Centro, Aracruz — ES<br/>
                CEP 29190-036
              </span>
            </p>
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-glow hover:text-white link-underline"
            >
              <MapPin className="h-3.5 w-3.5" /> Como chegar
            </button>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between text-xs text-white/55">
          <p>© {year} Clínica Levii. Todos os direitos reservados. CNPJ 00.000.000/0001-00 — Resp. Técnico CRO/ES 0000.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white">Política de Privacidade</a>
            <a href="#" className="hover:text-white">Termos de Uso</a>
          </div>
        </div>
      </div>
      <LocationModal open={locOpen} onOpenChange={setLocOpen} />
    </footer>
  );
}
