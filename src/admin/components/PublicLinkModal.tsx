import { useState } from "react";
import { Copy, Check, ExternalLink, Link as LinkIcon, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export default function PublicLinkModal({
  open, onOpenChange, title, description, path, helper,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  path: string;          // ex: /avaliar/abc123 ou /agendar/xyz
  helper?: string;       // texto explicativo customizado
}) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copiado!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Falha ao copiar", variant: "destructive" });
    }
  }

  function shareWhats() {
    const text = encodeURIComponent(`${title}\n\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center"><LinkIcon className="h-5 w-5" /></div>
            <div>
              <DialogTitle className="text-base">{title}</DialogTitle>
              {description && <DialogDescription className="text-xs mt-0.5">{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {helper && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-[12px] text-slate-600 leading-relaxed">
              {helper}
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">URL pública</label>
            <div className="flex gap-2">
              <Input readOnly value={url} className="font-mono text-xs bg-slate-50 border-slate-200 select-all" onFocus={(e) => e.currentTarget.select()} />
              <Button onClick={copy} variant={copied ? "default" : "outline"} className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Domínio captado automaticamente da hospedagem atual.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <a href={url} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full"><ExternalLink className="h-4 w-4 mr-2" /> Abrir</Button>
            </a>
            <Button onClick={shareWhats} className="bg-emerald-600 hover:bg-emerald-700"><Share2 className="h-4 w-4 mr-2" /> WhatsApp</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
