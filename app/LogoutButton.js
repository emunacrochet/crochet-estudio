"use client";

import { supabase } from "./lib/supabase";

export default function LogoutButton() {

  async function cerrarSesion() {

    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  return (
    <button onClick={cerrarSesion} style={boton}>
      Cerrar sesión
    </button>
  );
}

const boton = {
  background: "#3f2e27",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
};