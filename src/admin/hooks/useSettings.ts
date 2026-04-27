import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Integration = Tables<"external_integrations">;
export type ApiKey = Tables<"api_keys">;
export type WebhookEndpoint = Tables<"webhook_endpoints">;
export type ClinicSetting = Tables<"clinic_settings">;

export function useIntegrations() {
  return useQuery({
    queryKey: ["admin", "integrations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("external_integrations").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"external_integrations">) => {
      const { data, error } = await supabase.from("external_integrations").upsert(payload as any, { onConflict: "provider" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "integrations"] }),
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: ["admin", "api_keys"],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "api_keys"] }),
  });
}

export function useWebhooks() {
  return useQuery({
    queryKey: ["admin", "webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("webhook_endpoints").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"webhook_endpoints"> & { id?: string }) => {
      const { id, ...rest } = payload as any;
      if (id) {
        const { data, error } = await supabase.from("webhook_endpoints").update(rest).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("webhook_endpoints").insert(rest).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "webhooks"] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhook_endpoints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "webhooks"] }),
  });
}

export function useClinicSettings() {
  return useQuery({
    queryKey: ["admin", "clinic_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinic_settings").select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      (data ?? []).forEach((r) => (map[r.key] = r.value));
      return map;
    },
  });
}

export function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"clinic_settings">) => {
      // Chaves que precisam ser legíveis pelo site público (anônimos)
      const PUBLIC_KEYS = new Set(["general", "branding"]);
      const finalPayload: any = { ...payload };
      if (PUBLIC_KEYS.has(payload.key) && finalPayload.is_public === undefined) {
        finalPayload.is_public = true;
      }
      const { data, error } = await supabase.from("clinic_settings").upsert(finalPayload, { onConflict: "key" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "clinic_settings"] }),
  });
}
