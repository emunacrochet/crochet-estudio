"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function obtenerSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setLoading(false);
    }

    obtenerSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}