import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type AnamnesisTemplate = Tables<"anamnesis_templates">;
export type PatientAnamnesis = Tables<"patient_anamnesis">;

export function useAnamnesisTemplates() {
  return useQuery({
    queryKey: ["admin", "anamnesis_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anamnesis_templates")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as AnamnesisTemplate[];
    },
    staleTime: 60_000,
  });
}

export function usePatientAnamnesis(patientPhone?: string) {
  return useQuery({
    queryKey: ["admin", "patient_anamnesis", patientPhone],
    enabled: !!patientPhone,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_anamnesis")
        .select("*")
        .eq("patient_phone", patientPhone!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PatientAnamnesis[];
    },
  });
}

export function useCreateAnamnesis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      patient_phone: string;
      patient_name: string;
      template_id: string;
    }) => {
      const { data: tpl, error: tplErr } = await supabase
        .from("anamnesis_templates").select("*").eq("id", payload.template_id).single();
      if (tplErr) throw tplErr;
      const { data: ures } = await supabase.auth.getUser();
      const insert: TablesInsert<"patient_anamnesis"> = {
        patient_phone: payload.patient_phone,
        patient_name: payload.patient_name,
        template_id: tpl.id,
        template_snapshot: tpl as any,
        created_by: ures.user?.id ?? null,
      };
      const { data, error } = await supabase.from("patient_anamnesis").insert(insert).select().single();
      if (error) throw error;
      return data as PatientAnamnesis;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "patient_anamnesis", vars.patient_phone] });
    },
  });
}

export function useUpsertTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"anamnesis_templates"> & { id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { data, error } = await supabase.from("anamnesis_templates").update(rest as any).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("anamnesis_templates").insert(rest as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "anamnesis_templates"] }),
  });
}

export function useDeleteAnamnesis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patient_anamnesis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "patient_anamnesis"] }),
  });
}
