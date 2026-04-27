import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type ClinicalRecord = Tables<"clinical_records">;

export function useClinicalRecords(patientPhone?: string) {
  return useQuery({
    queryKey: ["admin", "clinical_records", patientPhone],
    enabled: !!patientPhone,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_records")
        .select("*")
        .eq("patient_phone", patientPhone!)
        .order("record_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClinicalRecord[];
    },
  });
}

export function useUpsertClinicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"clinical_records"> & { id?: string }) => {
      const { id, ...rest } = payload;
      if (!id) {
        const { data: ures } = await supabase.auth.getUser();
        (rest as any).created_by = ures.user?.id ?? null;
      }
      if (id) {
        const { data, error } = await supabase.from("clinical_records").update(rest as any).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("clinical_records").insert(rest as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["admin", "clinical_records", vars.patient_phone] }),
  });
}

export function useDeleteClinicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clinical_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "clinical_records"] }),
  });
}
