import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type PatientImage = Tables<"patient_images"> & { signedUrl?: string };

export function usePatientImages(patientPhone?: string) {
  return useQuery({
    queryKey: ["admin", "patient_images", patientPhone],
    enabled: !!patientPhone,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_images")
        .select("*")
        .eq("patient_phone", patientPhone!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as PatientImage[];
      // gera signed URLs em paralelo
      const signed = await Promise.all(
        rows.map(async (r) => {
          const { data: s } = await supabase.storage
            .from("patient-clinical-images")
            .createSignedUrl(r.storage_path, 3600);
          return { ...r, signedUrl: s?.signedUrl };
        }),
      );
      return signed;
    },
  });
}

export function useUploadPatientImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      patient_phone: string;
      file: File;
      category: string;
      tooth_fdi?: number | null;
      caption?: string | null;
      pair_id?: string | null;
    }) => {
      const ext = payload.file.name.split(".").pop() || "jpg";
      const path = `${payload.patient_phone}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("patient-clinical-images")
        .upload(path, payload.file, { contentType: payload.file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: ures } = await supabase.auth.getUser();
      const insert: TablesInsert<"patient_images"> = {
        patient_phone: payload.patient_phone,
        category: payload.category,
        tooth_fdi: payload.tooth_fdi ?? null,
        storage_path: path,
        caption: payload.caption ?? null,
        pair_id: payload.pair_id ?? null,
        uploaded_by: ures.user?.id ?? null,
      };
      const { data, error } = await supabase.from("patient_images").insert(insert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["admin", "patient_images", vars.patient_phone] }),
  });
}

export function useDeletePatientImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (img: PatientImage) => {
      await supabase.storage.from("patient-clinical-images").remove([img.storage_path]);
      const { error } = await supabase.from("patient_images").delete().eq("id", img.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "patient_images"] }),
  });
}
