"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./SessionProvider";

export default function AuthGuard({ children }) {

  const router = useRouter();

  const {
    session,
    loading,
    trialExpired,
  } = useSession();

  useEffect(() => {

    if (!loading) {

      if (!session) {
        router.push("/login");
      }

      if (trialExpired) {
        router.push("/prueba-finalizada");
      }
    }

  }, [session, loading, trialExpired, router]);

  if (loading) {
    return (
      <main style={loadingStyle}>
        Verificando acceso...
      </main>
    );
  }

  if (!session || trialExpired) {
    return null;
  }

  return children;
}

const loadingStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f1ea",
  fontFamily: "Georgia, serif",
  fontSize: "22px",
};