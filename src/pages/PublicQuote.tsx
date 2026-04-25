import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, CheckCircle2, FileText, AlertCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Quote = {
  id: string;
  patient_name: string;
  patient_phone: string;
  items: Array<{ name: string; qty: number; price_cents: number }>;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  status: string;
  notes: string | null;
  expires_at: string | null;
  accepted_at: string | null;
};

function brl(c: number) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function PublicQuote() {
  const { token } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("patient_quotes")
      .select("*")
      .eq("token", token!)
      .maybeSingle();
    if (error || !data) {
      setError("Orçamento não encontrado ou expirado.");
    } else {
      setQuote(data as any);
    }
    setLoading(false);
  }

  useEffect(() => { if (token) load(); }, [token]);

  async function accept() {
    if (!token) return;
    setAccepting(true);
    const { error } = await supabase.rpc("accept_quote_with_token", { _token: token });
    if (error) {
      toast({ title: "Erro ao aceitar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Orçamento aceito!", description: "Entraremos em contato em instantes." });
      await load();
    }
    setAccepting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border p-8 text-center shadow-sm">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-semibold mb-2">Orçamento indisponível</h1>
          <p className="text-sm text-muted-foreground">{error || "O link pode ter expirado ou já foi utilizado."}</p>
          <Link to="/"><Button className="mt-4" variant="outline">Voltar para o site</Button></Link>
        </div>
      </div>
    );
  }

  const accepted = quote.status === "accepted";
  const expired = quote.expires_at && new Date(quote.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamento personalizado</h1>
          <p className="text-sm text-muted-foreground mt-1">Para {quote.patient_name}</p>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {accepted && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-medium">Orçamento aceito em {new Date(quote.accepted_at!).toLocaleString("pt-BR")}</p>
            </div>
          )}

          <div className="p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Procedimentos</h2>
            <ul className="divide-y">
              {quote.items.map((it, i) => (
                <li key={i} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{it.name}</p>
                    <p className="text-xs text-muted-foreground">Qtd: {it.qty}</p>
                  </div>
                  <span className="font-semibold tabular-nums">{brl(it.price_cents * it.qty)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{brl(quote.subtotal_cents)}</span></div>
              {quote.discount_cents > 0 && (
                <div className="flex justify-between text-emerald-700"><span>Desconto</span><span className="tabular-nums">-{brl(quote.discount_cents)}</span></div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total</span><span className="tabular-nums">{brl(quote.total_cents)}</span></div>
            </div>

            {quote.notes && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-wrap">{quote.notes}</div>
            )}
          </div>

          <div className="border-t bg-slate-50/60 px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-muted-foreground">
              {quote.expires_at && (
                <Badge variant="outline" className={expired ? "border-rose-300 text-rose-700 bg-rose-50" : ""}>
                  {expired ? "Expirado" : `Válido até ${new Date(quote.expires_at).toLocaleDateString("pt-BR")}`}
                </Badge>
              )}
            </div>
            {!accepted && !expired && (
              <Button onClick={accept} disabled={accepting} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                {accepting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Aceitar orçamento
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p className="flex items-center justify-center gap-1.5">
            <Phone className="h-3 w-3" /> Dúvidas? Fale com a clínica pelo WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
