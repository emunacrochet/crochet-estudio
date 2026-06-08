"use client";
import AuthGuard from "../AuthGuard";
import Link from "next/link";
import { useState } from "react";

const puntos = [
  { nombre: "Cadeneta", simbolo: "○" },
  { nombre: "Punto raso / enano", simbolo: "●" },
  { nombre: "Punto bajo", simbolo: "+" },
  { nombre: "Medio punto alto", simbolo: "T" },
  { nombre: "Punto alto / vareta", simbolo: "Ŧ" },
  { nombre: "Punto alto doble", simbolo: "╪" },
  { nombre: "Aumento", simbolo: "V" },
  { nombre: "Disminución", simbolo: "∧" },
];

export default function CuadriculaCrochet() {
  const filas = 18;
  const columnas = 18;

  const crearGrid = () =>
    Array(filas)
      .fill(null)
      .map(() => Array(columnas).fill(""));

  const [grid, setGrid] = useState(crearGrid());
  const [herramienta, setHerramienta] = useState("✕");
  const [pintando, setPintando] = useState(false);

  function tocarCelda(fila, columna) {
    const nuevo = grid.map((row) => [...row]);
    nuevo[fila][columna] = herramienta;
    setGrid(nuevo);
  }

  function limpiar() {
    setGrid(crearGrid());
  }

  return (
  <AuthGuard>
    <main
      style={page}
      onMouseUp={() => setPintando(false)}
    >
      <Link href="/">
        <button style={volver}>
          ← Volver
        </button>
      </Link>

      <h1 style={titulo}>
        Cuadrícula Crochet
      </h1>

      <p style={texto}>
        Elegí un símbolo y tocá los cuadros.
      </p>

      <section style={panel}>
        <div style={herramientas}>
          {puntos.map((p) => (
            <button
              key={p.nombre}
              onClick={() => setHerramienta(p.simbolo)}
              style={{
                ...boton,
                background:
                  herramienta === p.simbolo
                    ? "#111"
                    : "white",
                color:
                  herramienta === p.simbolo
                    ? "white"
                    : "#111",
              }}
            >
              <strong style={{ fontSize: 22 }}>
                {p.simbolo}
              </strong>

              <span>
                {p.nombre}
              </span>
            </button>
          ))}

          <button
            onClick={() => setHerramienta("")}
            style={borrar}
          >
            Goma
          </button>
        </div>
      </section>

      <section style={panel}>
        <button
          style={limpiarBtn}
          onClick={limpiar}
        >
          Limpiar
        </button>
      </section>

      <section style={gridCard}>
        <div style={gridWrapper}>
          <div
            style={{
              ...gridStyle,
              gridTemplateColumns:
                `repeat(${columnas}, 24px)`,
            }}
          >
            {grid.map((fila, filaIndex) =>
              fila.map((celda, columnaIndex) => (
                <button
                  key={`${filaIndex}-${columnaIndex}`}
                  onMouseDown={() => {
                    setPintando(true);
                    tocarCelda(
                      filaIndex,
                      columnaIndex
                    );
                  }}
                  onMouseEnter={() => {
                    if (pintando) {
                      tocarCelda(
                        filaIndex,
                        columnaIndex
                      );
                    }
                  }}
                  onTouchStart={() => {
                    tocarCelda(
                      filaIndex,
                      columnaIndex
                    );
                  }}
                  style={celdaStyle}
                >
                  {celda || ""}
                </button>
              ))
            )}
          </div>
        </div>
      </section>
        </main>
  </AuthGuard>
);
}

const page = {
  minHeight: "100vh",
  background: "#f5f1ea",
  padding: "18px 12px",
  fontFamily: "Georgia, serif",
  color: "#222",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const volver = {
  background: "#111",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "12px",
  cursor: "pointer",
  marginBottom: "20px",
};

const titulo = {
  fontSize: "clamp(34px, 8vw, 60px)",
  marginBottom: "10px",
  textAlign: "center",
};

const texto = {
  fontSize: "18px",
  textAlign: "center",
  marginBottom: "18px",
};

const panel = {
  background: "white",
  borderRadius: "22px",
  padding: "16px",
  marginBottom: "16px",
  border: "1px solid #eadfd5",
  width: "100%",
  maxWidth: "560px",
};

const herramientas = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(88px, 1fr))",
  gap: "8px",
  width: "100%",
};

const boton = {
  border: "1px solid #ddd",
  borderRadius: "14px",
  padding: "10px 4px",
  background: "white",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "90px",
  fontSize: "13px",
  textAlign: "center",
};

const borrar = {
  border: "none",
  borderRadius: "14px",
  background: "#f0d6cf",
  color: "#9b2f20",
  cursor: "pointer",
  fontWeight: "bold",
};

const limpiarBtn = {
  width: "100%",
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: "14px",
  padding: "12px",
  cursor: "pointer",
  fontWeight: "bold",
};

const gridCard = {
  background: "white",
  borderRadius: "22px",
  padding: "14px",
  border: "1px solid #eadfd5",
  width: "100%",
  maxWidth: "560px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const gridWrapper = {
  width: "100%",
  overflowX: "auto",
  overflowY: "hidden",
  display: "flex",
  justifyContent: "center",
  paddingBottom: "8px",
};

const gridStyle = {
  display: "grid",
  width: "fit-content",
  margin: "0 auto",
  background: "#fff",
};

const celdaStyle = {
  width: "24px",
  height: "24px",
  border: "1px solid #d8d2ca",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "white",
  cursor: "pointer",
  padding: 0,
  fontSize: "14px",
  fontWeight: "bold",
};