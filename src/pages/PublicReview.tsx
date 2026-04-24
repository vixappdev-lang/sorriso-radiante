import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, CheckCircle2, Loader2, Heart } from "lucide-react";
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

  return (
    <>
      <SEO title={`Avaliar ${CLINIC_NAME}`} description="Conte como foi sua experiência conosco." />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 grid place-items-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 sm:px-10 py-8 text-white text-center">
              <div className="grid place-items-center mx-auto h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 mb-4">
                <Heart className="h-7 w-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Sua opinião é valiosa</h1>
              <p className="mt-2 text-white/80 text-sm sm:text-base">{CLINIC_NAME}</p>
            </div>

            <div className="p-6 sm:p-10">
              {loading ? (
                <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" /></div>
              ) : done ? (
                <div className="text-center py-8">
                  <div className="grid place-items-center mx-auto h-16 w-16 rounded-full bg-emerald-100 mb-4">
                    <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold">Obrigado pela sua avaliação!</h2>
                  <p className="text-muted-foreground mt-2 text-sm">Sua mensagem foi enviada para nossa equipe.</p>
                </div>
              ) : error && !invite ? (
                <div className="text-center py-8">
                  <p className="text-base font-semibold text-rose-600">{error}</p>
                  <p className="text-xs text-muted-foreground mt-2">Em caso de dúvida, entre em contato com a clínica.</p>
                </div>
              ) : invite && (
                <>
                  <div className="text-center mb-6">
                    <p className="text-base">
                      Olá, <span className="font-semibold">{invite.patient_name}</span>!
                    </p>
                    {(invite.treatment || invite.professional) && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {invite.treatment}{invite.treatment && invite.professional ? " · " : ""}{invite.professional}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-3">Como foi sua experiência conosco?</p>
                  </div>

                  <div className="flex justify-center gap-2 mb-7" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const filled = (hover || rating) >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHover(n)}
                          className="p-1.5 transition-transform active:scale-90 hover:scale-110"
                          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                        >
                          <Star className={cn("h-10 w-10 sm:h-12 sm:w-12 transition-colors", filled ? "fill-amber-400 text-amber-400" : "fill-none text-slate-300")} />
                        </button>
                      );
                    })}
                  </div>

                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Conte mais (opcional)</label>
                  <Textarea
                    rows={4}
                    placeholder="O que você mais gostou? Algo que podemos melhorar?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="resize-none"
                  />

                  {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}

                  <Button
                    onClick={submit}
                    disabled={submitting || rating < 1}
                    className="mt-5 w-full h-12 text-base bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-700"
                  >
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…</> : "Enviar avaliação"}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground mt-4">
                    Suas informações são tratadas com privacidade.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
