"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function iniciarSesion(e) {

    e.preventDefault();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3000",
      },
    });

    if (error) {
  setMensaje(error.message);
} else {
  setMensaje("Revisá tu correo para entrar.");
}
    
  }

  return (

    <main style={page}>

      <form onSubmit={iniciarSesion} style={card}>

        <h1 style={titulo}>
          Emuná Crochet Estudio
        </h1>

        <p style={texto}>
          Entrá a tus herramientas creativas.
        </p>

        <input
          type="email"
          placeholder="Tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
          required
        />

        <button type="submit" style={boton}>
          Continuar
        </button>

        <p style={mensajeStyle}>
          {mensaje}
        </p>

      </form>

    </main>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f5f1ea",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const card = {
  width: "100%",
  maxWidth: "420px",
  background: "white",
  padding: "40px 30px",
  borderRadius: "28px",
  border: "1px solid #eadfd5",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
};

const titulo = {
  fontSize: "38px",
  color: "#2f221c",
  marginBottom: "12px",
  lineHeight: "1.1",
};

const texto = {
  color: "#6b625d",
  marginBottom: "30px",
  lineHeight: "1.6",
};

const input = {
  width: "100%",
  padding: "16px",
  borderRadius: "14px",
  border: "1px solid #d8cdc3",
  marginBottom: "18px",
  fontSize: "16px",
  outline: "none",
};

const boton = {
  width: "100%",
  padding: "16px",
  borderRadius: "14px",
  border: "none",
  background: "#3f2e27",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
};

const mensajeStyle = {
  marginTop: "20px",
  color: "#6b625d",
  textAlign: "center",
};