import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CLINIC_INFO } from "@/data/clinic";

export type ClinicBrand = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  cep?: string;
};

const FALLBACK: ClinicBrand = {
  name: CLINIC_INFO.name,
  phone: CLINIC_INFO.phone.display,
  email: CLINIC_INFO.email,
};

let cache: ClinicBrand | null = null;
let pending: Promise<ClinicBrand> | null = null;
const listeners = new Set<(b: ClinicBrand) => void>();

async function fetchBrand(): Promise<ClinicBrand> {
  try {
    const { data } = await supabase
      .from("clinic_settings")
      .select("value")
      .eq("key", "general")
      .maybeSingle();
    const v = (data?.value ?? {}) as Partial<ClinicBrand>;
    const merged: ClinicBrand = {
      name: (v.name && String(v.name).trim()) || FALLBACK.name,
      phone: (v.phone && String(v.phone).trim()) || FALLBACK.phone,
      email: (v.email && String(v.email).trim()) || FALLBACK.email,
      address: v.address ? String(v.address) : undefined,
      cep: v.cep ? String(v.cep) : undefined,
    };
    cache = merged;
    listeners.forEach((l) => l(merged));
    return merged;
  } catch {
    cache = FALLBACK;
    return FALLBACK;
  }
}

let realtimeBound = false;
function bindRealtimeOnce() {
  if (realtimeBound) return;
  realtimeBound = true;
  try {
    supabase
      .channel("clinic_settings_brand")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clinic_settings", filter: "key=eq.general" },
        () => { fetchBrand(); }
      )
      .subscribe();
  } catch { /* noop */ }
}

export function useClinicBrand(): ClinicBrand {
  const [brand, setBrand] = useState<ClinicBrand>(cache ?? FALLBACK);

  useEffect(() => {
    listeners.add(setBrand);
    bindRealtimeOnce();
    if (cache) {
      setBrand(cache);
    } else {
      if (!pending) pending = fetchBrand().finally(() => { pending = null; });
      pending.then(setBrand).catch(() => {});
    }
    return () => { listeners.delete(setBrand); };
  }, []);

  return brand;
}

export function useClinicName(): string {
  return useClinicBrand().name;
}
