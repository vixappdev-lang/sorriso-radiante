import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";

const CLINIC_NAME = "Clínica Levii";

type Invite = {
  id: string;
  patient_name: string;
  professional: string | null;
  treatment: string | null;
  used_at: string | null;
};

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Muito insatisfeito", color: "text-rose-600" },
  2: { label: "Insatisfeito", color: "text-orange-600" },
  3: { label: "Razoável", color: "text-amber-600" },
  4: { label: "Bom", color: "text-emerald-600" },
  5: { label: "Excelente", color: "text-emerald-700" },
};

export default function PublicReview() {
  const { token = "" } = useParams();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("review_invites")
        .select("id,patient_name,professional,treatment,used_at")
        .eq("token", token)
        .maybeSingle();
      if (error || !data) { setError("Link inválido ou expirado."); setLoading(false); return; }
      if (data.used_at) { setError("Esta avaliação já foi enviada. Obrigado!"); setLoading(false); return; }
      setInvite(data as Invite);
      setLoading(false);
    })();
  }, [token]);

  async function submit() {
    if (rating < 1) { setError("Selecione de 1 a 5 estrelas."); return; }
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.rpc("submit_review_with_token", {
      _token: token, _rating: rating, _comment: comment.trim() || "",
    });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setDone(true);
  }

  const display = hover || rating;

  return (
    <>
      <SEO title={`Avaliar ${CLINIC_NAME}`} description="Conte como foi sua experiência conosco." />
      <main className="min-h-screen bg-slate-50/60 grid place-items-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-lg">
          {/* Marca */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-medium uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Avaliação
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">{CLINIC_NAME}</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-7 sm:p-10">
              {loading ? (
                <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" /></div>
              ) : done ? (
                <div className="text-center py-8">
                  <div className="grid place-items-center mx-auto h-16 w-16 rounded-full bg-emerald-50 mb-5 ring-8 ring-emerald-50/40">
                    <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Obrigado pela sua avaliação</h2>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-sm mx-auto">
                    Sua opinião foi enviada para nossa equipe e nos ajuda a continuar entregando o melhor cuidado.
                  </p>
                </div>
              ) : error && !invite ? (
                <div className="text-center py-8">
                  <p className="text-base font-semibold text-rose-600">{error}</p>
                  <p className="text-xs text-slate-500 mt-2">Em caso de dúvida, entre em contato com a clínica.</p>
                </div>
              ) : invite && (
                <>
                  <div className="text-center mb-7">
                    <p className="text-base text-slate-700">
                      Olá, <span className="font-semibold text-slate-900">{invite.patient_name.split(" ")[0]}</span>
                    </p>
                    {(invite.treatment || invite.professional) && (
                      <p className="text-xs text-slate-500 mt-2">
                        {invite.treatment}{invite.treatment && invite.professional ? " · " : ""}{invite.professional}
                      </p>
                    )}
                    <h2 className="mt-5 text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                      Como foi sua experiência conosco?
                    </h2>
                  </div>

                  {/* Estrelas */}
                  <div className="flex justify-center gap-1.5 sm:gap-2" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const filled = display >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHover(n)}
                          className="p-1 rounded-lg transition-transform active:scale-95 hover:scale-110"
                          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                        >
                          <Star className={cn("h-10 w-10 sm:h-11 sm:w-11 transition-colors",
                            filled ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200")} />
                        </button>
                      );
                    })}
                  </div>
                  <p className={cn("text-center text-xs font-medium mt-3 h-4 transition-colors",
                    display ? RATING_LABELS[display].color : "text-slate-300"
                  )}>
                    {display ? RATING_LABELS[display].label : "Toque nas estrelas para avaliar"}
                  </p>

                  <div className="mt-7">
                    <label className="block text-[12px] font-medium text-slate-700 mb-2">
                      Conte mais <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <Textarea
                      rows={4}
                      placeholder="O que você mais gostou? Algo que podemos melhorar?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="resize-none bg-slate-50 border-slate-200 focus:bg-white text-sm"
                    />
                  </div>

                  {error && <p className="text-sm text-rose-600 mt-3 text-center">{error}</p>}

                  <Button
                    onClick={submit}
                    disabled={submitting || rating < 1}
                    className="mt-6 w-full h-12 text-[15px] font-medium bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…</> : "Enviar avaliação"}
                  </Button>
                </>
              )}
            </div>

            {!done && !loading && (
              <div className="bg-slate-50/70 border-t border-slate-100 px-7 py-3 text-center">
                <p className="text-[11px] text-slate-400">
                  🔒 Suas informações são tratadas com privacidade.
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-6">© {new Date().getFullYear()} {CLINIC_NAME}</p>
        </div>
      </main>
    </>
  );
}
