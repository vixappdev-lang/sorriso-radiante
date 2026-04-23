import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AdminState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
};

export function useAdminSession(): AdminState {
  const [state, setState] = useState<AdminState>({
    loading: true,
    session: null,
    user: null,
    isAdmin: false,
  });

  useEffect(() => {
    let active = true;

    async function evaluate(session: Session | null) {
      if (!session) {
        if (active) setState({ loading: false, session: null, user: null, isAdmin: false });
        return;
      }
      // checa role admin via tabela user_roles (RLS permite o próprio admin enxergar)
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!active) return;
      setState({
        loading: false,
        session,
        user: session.user,
        isAdmin: !error && !!data,
      });
    }

    // 1) listener PRIMEIRO
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // adia chamadas async para evitar deadlock
      setTimeout(() => evaluate(session), 0);
    });

    // 2) carrega sessão atual
    supabase.auth.getSession().then(({ data }) => evaluate(data.session));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function adminSignOut() {
  await supabase.auth.signOut();
}
