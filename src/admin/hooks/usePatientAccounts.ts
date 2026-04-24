import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PatientAccount = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  cpf: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  address: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function usePatientAccounts() {
  return useQuery({
    queryKey: ["admin", "patient_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patient_accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PatientAccount[];
    },
  });
}

export function useUpsertPatientAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PatientAccount> & { id?: string }) => {
      const { id, ...rest } = payload as any;
      if (id) {
        const { data, error } = await supabase.from("patient_accounts").update(rest).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("patient_accounts").insert(rest).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "patient_accounts"] }),
  });
}
