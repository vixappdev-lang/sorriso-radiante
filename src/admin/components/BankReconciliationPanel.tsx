import { useMemo, useState } from "react";
import { Upload, FileText, CheckCircle2, Link as LinkIcon, AlertCircle, Download, Filter } from "lucide-react";
import EntityModal from "@/admin/components/EntityModal";
import EmptyState from "@/admin/components/EmptyState";
import DataTable, { type Column } from "@/admin/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useBankStatements, useStatementLines, useImportStatement, useReconcileLine,
  type BankStatement, type BankStatementLine,
} from "@/admin/hooks/useBankReconciliation";
import { useFinance } from "@/admin/hooks/useFinance";
import { toast } from "@/hooks/use-toast";

function brl(c: number) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

// Parser simples de OFX (suporta principais marcadores) e CSV (data;descricao;valor)
function parseStatement(text: string, kind: "ofx" | "csv"): { posted_at: string; description: string; amount_cents: number; raw_id?: string }[] {
  const lines: { posted_at: string; description: string; amount_cents: number; raw_id?: string }[] = [];
  if (kind === "ofx") {
    const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let m: RegExpExecArray | null;
    while ((m = trnRegex.exec(text))) {
      const block = m[1];
      const dt = block.match(/<DTPOSTED>([0-9]{8})/i)?.[1];
      const amt = block.match(/<TRNAMT>([\-0-9.,]+)/i)?.[1];
      const desc = (block.match(/<MEMO>([^<\n]+)/i)?.[1] || block.match(/<NAME>([^<\n]+)/i)?.[1] || "").trim();
      const id = block.match(/<FITID>([^<\n]+)/i)?.[1]?.trim();
      if (dt && amt) {
        const posted = `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`;
        const cents = Math.round(parseFloat(amt.replace(",", ".")) * 100);
        lines.push({ posted_at: posted, description: desc || "OFX", amount_cents: cents, raw_id: id });
      }
    }
  } else {
    const rows = text.split(/\r?\n/).filter((r) => r.trim());
    for (const row of rows) {
      // Detect delimiter
      const delim = row.includes(";") ? ";" : row.includes("\t") ? "\t" : ",";
      const parts = row.split(delim).map((p) => p.trim().replace(/^"|"$/g, ""));
      if (parts.length < 3) continue;
      // Heurística: data, descrição, valor (em qualquer ordem comum)
      const datePart = parts.find((p) => /^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}$/.test(p) || /^\d{4}-\d{2}-\d{2}$/.test(p));
      const amountPart = parts.find((p) => /^-?[\d.,]+$/.test(p) && p.length <= 16);
      if (!datePart || !amountPart || datePart === amountPart) continue;
      const desc = parts.filter((p) => p !== datePart && p !== amountPart).join(" - ").trim() || "CSV";
      let posted: string;
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) posted = datePart;
      else {
        const [d, m, yRaw] = datePart.split(/[\/\-]/);
        const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
        posted = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
      const cents = Math.round(parseFloat(amountPart.replace(/\./g, "").replace(",", ".")) * 100);
      if (Number.isFinite(cents)) lines.push({ posted_at: posted, description: desc, amount_cents: cents });
    }
  }
  return lines;
}

export default function BankReconciliationPanel() {
  const { data: statements = [] } = useBankStatements();
  const { data: entries = [] } = useFinance();
  const importStmt = useImportStatement();
  const reconcile = useReconcileLine();

  const [selected, setSelected] = useState<BankStatement | null>(null);
  const { data: lines = [] } = useStatementLines(selected?.id);

  const [importOpen, setImportOpen] = useState(false);
  const [imp, setImp] = useState({ bank: "", account: "", file: null as File | null, kind: "ofx" as "ofx" | "csv" });
  const [matchLine, setMatchLine] = useState<BankStatementLine | null>(null);

  // Sugestão automática: entradas pendentes com valor próximo
  function suggestMatches(line: BankStatementLine) {
    const target = Math.abs(line.amount_cents);
    return entries
      .filter((e) => e.status !== "paid" && Math.abs(e.amount_cents - target) < 100)
      .slice(0, 8);
  }

  async function importFile() {
    if (!imp.file || !imp.bank) return toast({ title: "Selecione banco e arquivo", variant: "destructive" });
    const text = await imp.file.text();
    const parsed = parseStatement(text, imp.kind);
    if (parsed.length === 0) return toast({ title: "Nenhuma transação encontrada", variant: "destructive" });
    try {
      await importStmt.mutateAsync({ bank_name: imp.bank, account: imp.account, lines: parsed });
      toast({ title: `Importado: ${parsed.length} transações` });
      setImportOpen(false);
      setImp({ bank: "", account: "", file: null, kind: "ofx" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  const stmtCols: Column<BankStatement>[] = [
    { key: "bank_name", header: "Banco", cell: (s) => (
      <div className="min-w-0">
        <p className="font-medium truncate">{s.bank_name}</p>
        <p className="text-xs text-muted-foreground truncate">{s.account || "—"}</p>
      </div>
    ) },
    { key: "period", header: "Período", cell: (s) => (
      <span className="text-sm tabular-nums">{s.period_start ? new Date(s.period_start).toLocaleDateString("pt-BR") : "—"} → {s.period_end ? new Date(s.period_end).toLocaleDateString("pt-BR") : "—"}</span>
    ), className: "hidden md:table-cell" },
    { key: "total_lines", header: "Transações", cell: (s) => <Badge variant="secondary">{s.total_lines}</Badge> },
    { key: "reconciled_lines", header: "Conciliadas", cell: (s) => {
      const pct = s.total_lines > 0 ? Math.round((s.reconciled_lines / s.total_lines) * 100) : 0;
      return (
        <div className="min-w-[120px]">
          <div className="flex items-center justify-between text-xs mb-1"><span>{s.reconciled_lines}/{s.total_lines}</span><span className="text-muted-foreground">{pct}%</span></div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
        </div>
      );
    } },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">Conciliação bancária</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Importe extratos OFX ou CSV e concilie cada linha com os lançamentos do financeiro.</p>
        </div>
        <Button onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-2" /> Importar extrato</Button>
      </div>

      {statements.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum extrato importado" description="Suba um arquivo OFX (do internet banking) ou CSV (data; descrição; valor) para começar a conciliar." action={<Button onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-2" /> Importar extrato</Button>} />
      ) : (
        <DataTable rows={statements} columns={stmtCols} pageSize={8} onRowClick={(s) => setSelected(s)} />
      )}

      {/* Modal importação */}
      <EntityModal
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar extrato bancário"
        description="OFX (recomendado) ou CSV simples. As linhas viram transações para conciliar."
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button><Button onClick={importFile}>Importar</Button></div>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Banco*</Label><Input value={imp.bank} onChange={(e) => setImp({ ...imp, bank: e.target.value })} placeholder="Itaú, Nubank, Bradesco…" /></div>
            <div><Label className="text-xs">Conta</Label><Input value={imp.account} onChange={(e) => setImp({ ...imp, account: e.target.value })} placeholder="Ag/Conta" /></div>
          </div>
          <div>
            <Label className="text-xs">Formato</Label>
            <Select value={imp.kind} onValueChange={(v: any) => setImp({ ...imp, kind: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ofx">OFX (Open Financial Exchange)</SelectItem>
                <SelectItem value="csv">CSV (data; descrição; valor)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Arquivo*</Label>
            <Input type="file" accept={imp.kind === "ofx" ? ".ofx,.OFX,.qfx" : ".csv,.CSV,.tsv,.txt"} onChange={(e) => setImp({ ...imp, file: e.target.files?.[0] ?? null })} />
            {imp.file && <p className="text-[11px] text-muted-foreground mt-1">{imp.file.name} · {(imp.file.size / 1024).toFixed(1)} KB</p>}
          </div>
        </div>
      </EntityModal>

      {/* Modal: ver linhas do extrato */}
      <EntityModal
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        title={selected ? `${selected.bank_name} — ${selected.account || "Conta"}` : ""}
        description={selected ? `${selected.reconciled_lines}/${selected.total_lines} conciliadas` : ""}
        size="xl"
      >
        <LinesView lines={lines} onMatch={setMatchLine} />
      </EntityModal>

      {/* Modal: conciliar com lançamento */}
      <EntityModal
        open={!!matchLine}
        onOpenChange={(v) => !v && setMatchLine(null)}
        title={matchLine ? `Conciliar — ${matchLine.description}` : ""}
        description={matchLine ? `${brl(matchLine.amount_cents)} em ${new Date(matchLine.posted_at).toLocaleDateString("pt-BR")}` : ""}
      >
        {matchLine && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Sugestões com valor próximo:</p>
            {suggestMatches(matchLine).length === 0 ? (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200 flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                Nenhuma sugestão automática. Cadastre um lançamento manual no Financeiro com esse valor para conciliar.
              </div>
            ) : (
              <ul className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {suggestMatches(matchLine).map((e) => (
                  <li key={e.id} className="rounded-lg border border-[hsl(var(--admin-border))] p-3 flex items-center justify-between gap-2 hover:bg-muted/30 transition">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{e.description || "Lançamento"}</p>
                      <p className="text-[11px] text-muted-foreground">{e.patient_name ?? "—"} · {e.due_date ? new Date(e.due_date).toLocaleDateString("pt-BR") : "—"}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums text-emerald-700">{brl(e.amount_cents)}</span>
                      <Button size="sm" onClick={async () => {
                        await reconcile.mutateAsync({ line_id: matchLine.id, entry_id: e.id, statement_id: matchLine.statement_id });
                        toast({ title: "Conciliado!" });
                        setMatchLine(null);
                      }}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Conciliar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </EntityModal>
    </div>
  );
}
