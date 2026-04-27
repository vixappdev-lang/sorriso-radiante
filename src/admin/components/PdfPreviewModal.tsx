import { useEffect, useMemo, useState } from "react";
import { forwardRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2, X } from "lucide-react";
import type jsPDF from "jspdf";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  /** Função lazy que produz o doc — só roda quando abre */
  buildDoc: () => jsPDF | Promise<jsPDF>;
  filename: string;
};

const PdfPreviewModal = forwardRef<HTMLDivElement, Props>(function PdfPreviewModal({ open, onOpenChange, title, description, buildDoc, filename }, ref) {
  const [url, setUrl] = useState<string | null>(null);
  const [doc, setDoc] = useState<jsPDF | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let createdUrl: string | null = null;
    setLoading(true);
    setUrl(null);
    setError(null);
    (async () => {
      try {
        const d = await buildDoc();
        if (cancelled) return;
        const blob = d.output("blob");
        createdUrl = URL.createObjectURL(blob);
        setDoc(d);
        setUrl(createdUrl);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Não foi possível gerar o PDF.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function download() {
    if (doc) doc.save(filename);
  }
  function openTab() {
    if (url) window.open(url, "_blank");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={ref} hideClose className="p-0 sm:max-w-5xl w-[96vw] h-[92vh] max-h-[95vh] overflow-hidden flex flex-col gap-0 bg-card text-card-foreground border-[hsl(var(--admin-border))]">
        <DialogHeader className="border-b border-[hsl(var(--admin-border))] px-5 py-3 flex-row items-center justify-between space-y-0">
          <div className="min-w-0">
            <DialogTitle className="text-[15px] font-semibold tracking-tight">{title}</DialogTitle>
            {description && <DialogDescription className="text-xs">{description}</DialogDescription>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={openTab} disabled={!url}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir
            </Button>
            <Button size="sm" onClick={download} disabled={!doc}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Baixar PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 bg-[hsl(220_18%_18%)] overflow-hidden">
          {error ? (
            <div className="h-full grid place-items-center text-white/80 px-6 text-center">
              <div>
                <p className="text-sm font-semibold text-white">Erro ao gerar PDF</p>
                <p className="text-xs text-white/65 mt-1 max-w-md">{error}</p>
              </div>
            </div>
          ) : loading || !url ? (
            <div className="h-full grid place-items-center text-white/80">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando PDF…
              </div>
            </div>
          ) : (
            <iframe
              key={url}
              src={`${url}#toolbar=0&navpanes=0`}
              title={title}
              className="w-full h-full border-0"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default PdfPreviewModal;
