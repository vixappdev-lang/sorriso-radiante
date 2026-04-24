import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, CheckCircle2, Loader2, Sparkles, Heart } from "lucide-react";
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
  1: { label: "Muito insatisfeito", color: "text-rose-500" },
  2: { label: "Insatisfeito", color: "text-orange-500" },
  3: { label: "Razoável", color: "text-amber-500" },
  4: { label: "Bom", color: "text-emerald-500" },
  5: { label: "Excepcional", color: "text-emerald-400" },
};

function Confetti() {
  const colors = ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"];
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        color: colors[i % colors.length],
        rot: Math.random() * 360,
      })),
    []
  );
  return (
    <>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </>
  );
}

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
    <div className="app-shell">
      <SEO title={`Avaliar ${CLINIC_NAME}`} description="Conte como foi sua experiência conosco." />
      {done && <Confetti />}

      <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 grid place-items-center px-4 py-10 sm:py-16">
        {/* Decorative blobs */}
        <div aria-hidden className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />
        <div aria-hidden className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="relative w-full max-w-lg">
          {/* Brand */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-slate-200/80 text-slate-700 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-sm">
              <Sparkles className="h-3 w-3 text-amber-500" /> Sua opinião conta
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {CLINIC_NAME}
            </h1>
          </div>

          {/* Card principal */}
          <div className="relative">
            {/* Borda gradiente */}
            <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-slate-200 via-blue-100 to-slate-200 opacity-70" />
            <div className="relative bg-white rounded-[27px] shadow-[0_8px_30px_-8px_rgba(15,23,42,0.12)] overflow-hidden">
              <div className="p-7 sm:p-10">
                {loading ? (
                  <div className="text-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-slate-400 mx-auto" />
                  </div>
                ) : done ? (
                  <div className="text-center py-6">
                    <div className="grid place-items-center mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 mb-6 ring-8 ring-emerald-50/50">
                      <CheckCircle2 className="h-11 w-11 text-emerald-600" strokeWidth={2.2} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Obrigado pela sua avaliação!
                    </h2>
                    <p className="text-slate-500 mt-3 text-[15px] leading-relaxed max-w-sm mx-auto">
                      Sua opinião foi enviada para nossa equipe e nos ajuda a continuar entregando o melhor cuidado.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
                      Feito com cuidado pela {CLINIC_NAME}
                    </div>
                  </div>
                ) : error && !invite ? (
                  <div className="text-center py-12">
                    <p className="text-base font-semibold text-rose-600">{error}</p>
                    <p className="text-xs text-slate-500 mt-2">Em caso de dúvida, entre em contato com a clínica.</p>
                  </div>
                ) : invite && (
                  <>
                    <div className="text-center mb-8">
                      <p className="text-base text-slate-700">
                        Olá, <span className="font-bold text-slate-900">{invite.patient_name.split(" ")[0]}</span> 👋
                      </p>
                      {(invite.treatment || invite.professional) && (
                        <p className="text-xs text-slate-500 mt-2.5">
                          {invite.treatment}{invite.treatment && invite.professional ? " · " : ""}{invite.professional}
                        </p>
                      )}
                      <h2 className="mt-6 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                        Como foi sua experiência<br/>conosco?
                      </h2>
                    </div>

                    {/* Estrelas grandes com glow */}
                    <div
                      className="flex justify-center gap-1.5 sm:gap-2"
                      onMouseLeave={() => setHover(0)}
                    >
                      {[1, 2, 3, 4, 5].map((n) => {
                        const filled = display >= n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            onMouseEnter={() => setHover(n)}
                            className={cn(
                              "relative p-1.5 rounded-2xl transition-all duration-200",
                              "hover:scale-125 active:scale-110",
                              filled && rating >= n && "drop-shadow-[0_4px_12px_rgba(251,191,36,0.45)]"
                            )}
                            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                          >
                            <Star
                              className={cn(
                                "h-12 w-12 sm:h-14 sm:w-14 transition-all duration-200",
                                filled
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-slate-100 text-slate-200"
                              )}
                              strokeWidth={1.5}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <p
                      className={cn(
                        "text-center text-sm font-semibold mt-4 h-5 transition-colors",
                        display ? RATING_LABELS[display].color : "text-slate-300"
                      )}
                    >
                      {display ? RATING_LABELS[display].label : "Toque nas estrelas para avaliar"}
                    </p>

                    <div className="mt-8">
                      <label className="block text-[13px] font-semibold text-slate-700 mb-2.5">
                        Conte mais{" "}
                        <span className="text-slate-400 font-normal">(opcional)</span>
                      </label>
                      <Textarea
                        rows={4}
                        placeholder="O que você mais gostou? Algo que podemos melhorar?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="resize-none bg-slate-50/80 border-slate-200/80 focus:bg-white text-[14px] rounded-xl"
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-rose-600 mt-3 text-center font-medium">
                        {error}
                      </p>
                    )}

                    <Button
                      onClick={submit}
                      disabled={submitting || rating < 1}
                      className="mt-7 w-full h-13 py-3.5 text-[15px] font-semibold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl shadow-[0_4px_12px_-2px_rgba(15,23,42,0.25)] hover:shadow-[0_6px_16px_-2px_rgba(15,23,42,0.35)] transition-all"
                    >
                      {submitting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…</>
                      ) : (
                        "Enviar avaliação"
                      )}
                    </Button>
                  </>
                )}
              </div>

              {!done && !loading && (
                <div className="bg-slate-50/60 border-t border-slate-100 px-7 py-3.5 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">
                    🔒 Suas informações são tratadas com privacidade.
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-7 font-medium">
            © {new Date().getFullYear()} {CLINIC_NAME}
          </p>
        </div>
      </main>
    </div>
  );
}
