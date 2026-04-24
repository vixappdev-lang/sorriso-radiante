import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ClinicHour = Tables<"clinic_hours">;

export const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function useClinicHours() {
  return useQuery({
    queryKey: ["admin", "clinic_hours"],
    queryFn: async (): Promise<ClinicHour[]> => {
      const { data, error } = await supabase.from("clinic_hours").select("*").order("weekday");
      if (error) throw error;
      // garante 7 dias
      const map = new Map((data ?? []).map((d) => [d.weekday, d]));
      return Array.from({ length: 7 }, (_, i) =>
        map.get(i) ?? { weekday: i, is_open: i !== 0, open_time: "08:00", close_time: "18:00", updated_at: new Date().toISOString() } as ClinicHour
      );
    },
  });
}

export function useUpsertClinicHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hours: { weekday: number; is_open: boolean; open_time: string | null; close_time: string | null; }[]) => {
      const { error } = await supabase.from("clinic_hours").upsert(hours as any, { onConflict: "weekday" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "clinic_hours"] }),
  });
}
