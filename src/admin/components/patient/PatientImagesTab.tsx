import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import EntityModal from "@/admin/components/EntityModal";
import EmptyState from "@/admin/components/EmptyState";
import {
  usePatientImages,
  useUploadPatientImage,
  useDeletePatientImage,
  type PatientImage,
} from "@/admin/hooks/usePatientImages";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Props = { patientPhone: string };

const CATEGORIES = [
  { value: "intraoral", label: "Intraoral" },
  { value: "extraoral", label: "Extraoral" },
  { value: "before", label: "Antes" },
  { value: "after", label: "Depois" },
  { value: "xray", label: "Raio-X" },
  { value: "tomografia", label: "Tomografia" },
  { value: "documento", label: "Documento" },
];

export default function PatientImagesTab({ patientPhone }: Props) {
  const { data: images = [], refetch } = usePatientImages(patientPhone);
  const upload = useUploadPatientImage();
  const del = useDeletePatientImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState({ category: "intraoral", tooth_fdi: "", caption: "" });
  const [filter, setFilter] = useState<string>("all");
  const [viewer, setViewer] = useState<PatientImage | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo 8 MB.", variant: "destructive" });
      return;
    }
    setPendingFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function confirmUpload() {
    if (!pendingFile) return;
    try {
      await upload.mutateAsync({
        patient_phone: patientPhone,
        file: pendingFile,
        category: meta.category,
        tooth_fdi: meta.tooth_fdi ? parseInt(meta.tooth_fdi) : null,
        caption: meta.caption || null,
      });
      toast({ title: "Imagem enviada" });
      setPendingFile(null);
      setPreview(null);
      setMeta({ category: "intraoral", tooth_fdi: "", caption: "" });
      refetch();
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e.message, variant: "destructive" });
    }
  }

  const filtered = filter === "all" ? images : images.filter((i) => i.category === filter);

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      <Button onClick={() => fileRef.current?.click()} size="sm" className="w-full">
        <Upload className="h-3.5 w-3.5 mr-1.5" /> Enviar imagem clínica
      </Button>

      <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1">
        {[{ value: "all", label: "Todas" }, ...CATEGORIES].map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
              filter === c.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-[hsl(var(--admin-border))] text-muted-foreground hover:text-foreground"
            )}
          >
            {c.label}
            {c.value !== "all" && (
              <span className="ml-1 opacity-60">
                {images.filter((i) => i.category === c.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="Sem imagens nesta categoria"
          description="Envie radiografias, fotos intraorais, antes/depois ou documentos. Armazenamento privado."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((img) => (
            <button
              key={img.id}
              onClick={() => setViewer(img)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-[hsl(var(--admin-border))] bg-muted/40 text-left"
            >
              {img.signedUrl ? (
                <img src={img.signedUrl} alt={img.caption ?? ""} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="grid h-full w-full place-items-center text-[10px] text-muted-foreground">carregando…</div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                <div className="flex items-center justify-between gap-1">
                  <Badge variant="outline" className="bg-white/95 dark:bg-slate-800/95 text-[9px] py-0 h-4 border-0 text-slate-800 dark:text-slate-100">
                    {CATEGORIES.find((c) => c.value === img.category)?.label ?? img.category}
                  </Badge>
                  {img.tooth_fdi && (
                    <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/80 text-[9px] py-0 h-4 border-0 text-amber-900 dark:text-amber-100">
                      Dente {img.tooth_fdi}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal upload com metadados */}
      <EntityModal
        open={!!pendingFile}
        onOpenChange={(v) => { if (!v) { setPendingFile(null); setPreview(null); } }}
        title="Enviar imagem clínica"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setPendingFile(null); setPreview(null); }}>Cancelar</Button>
            <Button onClick={confirmUpload} disabled={upload.isPending}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> {upload.isPending ? "Enviando…" : "Enviar"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {preview && (
            <div className="rounded-lg border bg-muted/30 p-2">
              <img src={preview} alt="preview" className="max-h-56 w-full object-contain rounded" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={meta.category} onValueChange={(v) => setMeta({ ...meta, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Dente (FDI)</Label>
              <Input
                type="number"
                placeholder="Ex.: 26"
                value={meta.tooth_fdi}
                onChange={(e) => setMeta({ ...meta, tooth_fdi: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Legenda</Label>
            <Input
              value={meta.caption}
              onChange={(e) => setMeta({ ...meta, caption: e.target.value })}
              placeholder="Ex.: pré-operatório · pós 30 dias…"
            />
          </div>
        </div>
      </EntityModal>

      {/* Viewer */}
      <EntityModal
        open={!!viewer}
        onOpenChange={(v) => !v && setViewer(null)}
        title={viewer?.caption || "Imagem clínica"}
        description={viewer ? `${CATEGORIES.find((c) => c.value === viewer.category)?.label ?? viewer.category} · ${new Date(viewer.created_at).toLocaleDateString("pt-BR")}` : ""}
        size="lg"
        footer={
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              onClick={async () => {
                if (!viewer) return;
                if (!confirm("Excluir esta imagem? Não é reversível.")) return;
                await del.mutateAsync(viewer);
                setViewer(null);
                refetch();
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
            </Button>
            <Button variant="outline" onClick={() => setViewer(null)}><X className="h-3.5 w-3.5 mr-1.5" /> Fechar</Button>
          </div>
        }
      >
        {viewer?.signedUrl && (
          <img src={viewer.signedUrl} alt={viewer.caption ?? ""} className="w-full max-h-[70vh] object-contain rounded-lg bg-black/5" />
        )}
      </EntityModal>
    </div>
  );
}
