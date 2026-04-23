import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, RefreshCw, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ptBR } from "date-fns/locale";
import PageHeader from "@/admin/components/PageHeader";
import EmptyState from "@/admin/components/EmptyState";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminAgenda() {
  const { data: appts = [], isLoading, refetch } = useAppointments();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Date>(new Date());
  const [busyId, setBusyId] = useState<string | null>(null);

  const dayKey = iso(selected);
  const dayAppts = useMemo(
    () =>
      appts
        .filter((a) => a.appointment_date === dayKey)
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)),
    [appts, dayKey],
  );

  const datesWith = useMemo(() => new Set(appts.map((a) => a.appointment_date)), [appts]);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Atualizado", description: `Agendamento marcado como ${status}.` });
    qc.invalidateQueries({ queryKey: ["admin", "appointments"] });
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Visualize, confirme, reagende e cancele consultas."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        <div className="rounded-2xl border bg-card p-4">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => d && setSelected(d)}
            locale={ptBR}
            className="rounded-md"
            modifiers={{ hasAppt: (d) => datesWith.has(iso(d)) }}
            modifiersClassNames={{ hasAppt: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary" }}
          />
          <div className="mt-3 px-2 text-xs text-muted-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> dias com agendamento
          </div>
        </div>

        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg">
                {selected.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </h3>
              <p className="text-xs text-muted-foreground">{dayAppts.length} agendamento(s)</p>
            </div>
          </div>
          {isLoading ? (
            <div className="p-10 grid place-items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : dayAppts.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={CalendarIcon} title="Sem agendamentos neste dia" description="Selecione outro dia ou aguarde novos pedidos pelo site." />
            </div>
          ) : (
            <ul className="divide-y">
              {dayAppts.map((a) => (
                <li key={a.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="text-center min-w-[64px]">
                    <p className="text-lg font-semibold tabular-nums">{a.appointment_time}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">{a.status}</Badge>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.treatment} · {a.phone}</p>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{a.notes}"</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={busyId === a.id || a.status === "confirmed"} onClick={() => setStatus(a.id, "confirmed")}>Confirmar</Button>
                    <Button size="sm" variant="outline" disabled={busyId === a.id || a.status === "done"} onClick={() => setStatus(a.id, "done")}>Concluir</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={busyId === a.id} onClick={() => setStatus(a.id, "cancelled")}>Cancelar</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
