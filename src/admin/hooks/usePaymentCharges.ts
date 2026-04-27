import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type PaymentCharge = Tables<"payment_charges">;

export function usePaymentCharges(filter?: { status?: string; phone?: string }) {
  return useQuery({
    queryKey: ["admin", "payment_charges", filter ?? {}],
    queryFn: async () => {
      let q = supabase.from("payment_charges").select("*").order("created_at", { ascending: false }).limit(200);
      if (filter?.status) q = q.eq("status", filter.status);
      if (filter?.phone) q = q.eq("patient_phone", filter.phone);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PaymentCharge[];
    },
  });
}

export function useCreateCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"payment_charges">) => {
      const { data: ures } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("payment_charges")
        .insert({ ...payload, created_by: ures.user?.id ?? null } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "payment_charges"] }),
  });
}

export function useMarkChargePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_charges")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "payment_charges"] }),
  });
}
