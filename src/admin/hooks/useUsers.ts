import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StaffUser = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  avatar_url: string | null;
  active: boolean;
  is_admin: boolean;
  permissions: Record<string, { view: boolean; edit: boolean; delete: boolean }>;
};

export const PERMISSION_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "agenda", label: "Agenda" },
  { key: "pacientes", label: "Pacientes" },
  { key: "tratamentos", label: "Tratamentos" },
  { key: "profissionais", label: "Profissionais" },
  { key: "financeiro", label: "Financeiro" },
  { key: "leads", label: "Leads" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "avaliacoes", label: "Avaliações" },
  { key: "site", label: "Site/CMS" },
  { key: "relatorios", label: "Relatórios" },
  { key: "configuracoes", label: "Configurações" },
] as const;

export function useStaffUsers() {
  return useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async (): Promise<StaffUser[]> => {
      const [{ data: profiles }, { data: roles }, { data: perms }] = await Promise.all([
        supabase.from("staff_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("user_permissions").select("*"),
      ]);
      const adminMap = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
      const permMap: Record<string, any> = {};
      (perms ?? []).forEach((p) => {
        if (!permMap[p.user_id]) permMap[p.user_id] = {};
        permMap[p.user_id][p.module] = { view: p.can_view, edit: p.can_edit, delete: p.can_delete };
      });
      return (profiles ?? []).map((p) => ({
        ...p,
        is_admin: adminMap.has(p.user_id),
        permissions: permMap[p.user_id] ?? {},
      }));
    },
  });
}

export function useCreateStaffUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; full_name: string; job_title?: string; is_admin: boolean; permissions: Record<string, { view: boolean; edit: boolean; delete: boolean }>; }) => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "create", payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "staff"] }),
  });
}

export function useUpdateStaffPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { user_id: string; is_admin: boolean; permissions: Record<string, { view: boolean; edit: boolean; delete: boolean }>; }) => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "update_perms", payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "staff"] }),
  });
}

export function useDeleteStaffUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user_id: string) => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "delete", payload: { user_id } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "staff"] }),
  });
}
