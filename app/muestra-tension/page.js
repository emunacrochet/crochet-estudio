"use client";
import AuthGuard from "../AuthGuard";
import { useState } from "react";

export default function MuestraTension() {
  const [puntos, setPuntos] = useState(18);
  const [vueltas, setVueltas] = useState(22);

  const [gancho, setGancho] = useState("4.0 mm");

  const [patronPuntos, setPatronPuntos] = useState(20);
  const [patronVueltas, setPatronVueltas] = useState(24);
  const [patronBase, setPatronBase] = useState(100);

  const diferencia = Math.round(
    ((puntos - patronPuntos) / patronPuntos) * 100
  );

  const escala = Math.round((patronBase * puntos) / patronPuntos);

  const ganchos = [
    "2.0 mm",
    "2.5 mm",
    "3.0 mm",
    "3.5 mm",
    "4.0 mm",
    "4.5 mm",
    "5.0 mm",
    "5.5 mm",
    "6.0 mm",
    "8.0 mm",
    "10.0 mm",
  ];

  return (
  <AuthGuard>
    <main style={styles.page}>
      <button
        style={styles.backButton}
        onClick={() => (window.location.href = "/")}
      >
        ← Volver al inicio
      </button>

      <div style={styles.dots}>
        <span style={{ ...styles.dot, background: "#cc7548" }} />
        <span style={{ ...styles.dot, background: "#88aa92" }} />
        <span style={{ ...styles.dot, background: "#c47b93" }} />
      </div>

      <h1 style={styles.title}>Muestra de Tensión</h1>

      <section style={styles.cardGrande}>
        <div style={styles.info}>
          <h2 style={styles.subtitulo}>1. MEDÍ TU MUESTRA</h2>

          <p style={styles.texto}>
            Tejé una muestra de al menos 12 × 12 cm.
          </p>

         <p style={styles.texto}>
  Contá cuántos puntos y vueltas hay dentro de 10 cm reales de tu
  muestra utilizando una regla o cinta métrica.
</p>
        </div>

        <div style={styles.gridContainer}>
          <div style={styles.grid10}>
            {[...Array(100)].map((_, i) => (
              <div key={i} style={styles.cell}></div>
            ))}

            <div style={styles.square}></div>
          </div>

          <div style={styles.cmTop}>10 cm</div>
          <div style={styles.cmSide}>10 cm</div>
        </div>

        <div style={styles.counterArea}>
          <div style={styles.counterBox}>
            <h3 style={styles.counterTitle}>PUNTOS EN 10 CM</h3>

            <div style={styles.counterRow}>
              <button
                style={styles.minus}
                onClick={() => setPuntos(puntos - 1)}
              >
                −
              </button>

              <span style={styles.numberOrange}>{puntos}</span>

              <button
                style={styles.plus}
                onClick={() => setPuntos(puntos + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div style={styles.separator}></div>

          <div style={styles.counterBox}>
            <h3 style={styles.counterTitle}>VUELTAS EN 10 CM</h3>

            <div style={styles.counterRow}>
              <button
                style={styles.minusGreen}
                onClick={() => setVueltas(vueltas - 1)}
              >
                −
              </button>

              <span style={styles.numberGreen}>{vueltas}</span>

              <button
                style={styles.plusGreen}
                onClick={() => setVueltas(vueltas + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      <div style={styles.grid2}>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>DETALLES DE TU MUESTRA</h2>

          <h3 style={styles.label}>Gancho utilizado</h3>

          <div style={styles.options}>
            {ganchos.map((item) => (
              <button
                key={item}
                onClick={() => setGancho(item)}
                style={{
                  ...styles.optionButton,
                  background: gancho === item ? "#cc7548" : "white",
                  color: gancho === item ? "white" : "#444",
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <h3 style={styles.label}>Observaciones</h3>

          <textarea
            placeholder="Ej: hilo utilizado, lavado, bloqueo, punto, proyecto..."
            style={styles.textarea}
          />

          <button
  style={styles.saveButton}
  onClick={() => {
    localStorage.setItem(
      "muestraTensionActual",
      JSON.stringify({
        puntos,
        vueltas,
        gancho,
        patronPuntos,
        patronVueltas,
        diferencia,
        escala,
        fecha: new Date().toLocaleDateString(),
      })
    );

    window.location.href = "/mi-proyecto";
  }}
>
  Guardar en Mi Proyecto
</button>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>COMPARAR CON PATRÓN</h2>

          <div style={styles.inputGroup}>
            <label>Puntos del patrón</label>

            <input
              type="number"
              value={patronPuntos}
              onChange={(e) => setPatronPuntos(Number(e.target.value))}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Vueltas del patrón</label>

            <input
              type="number"
              value={patronVueltas}
              onChange={(e) => setPatronVueltas(Number(e.target.value))}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Si el patrón pide X puntos</label>

            <input
              type="number"
              value={patronBase}
              onChange={(e) => setPatronBase(Number(e.target.value))}
              style={styles.input}
            />
          </div>

          <div style={styles.alert}>
            <strong>
              {diferencia < 0
                ? "Tu muestra está más suelta"
                : "Tu muestra está más apretada"}
            </strong>

            <p style={{ marginTop: "10px" }}>
              Diferencia: {diferencia}%
            </p>

            <p>
              {diferencia < 0
                ? "Probá bajar el número del gancho."
                : "Probá subir el número del gancho."}
            </p>
          </div>

          <div style={styles.scaleCard}>
            Si el patrón pide {patronBase} puntos,
            necesitarías aproximadamente <strong>{escala} puntos.</strong>
          </div>
        </section>
      </div>
        </main>
  </AuthGuard>
  
);  
}

const styles = {
  page: {
    background: "#f5f1ea",
    minHeight: "100vh",
    padding: "40px",
    fontFamily: "serif",
  },

  backButton: {
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "12px 18px",
    cursor: "pointer",
    marginBottom: "24px",
    fontSize: "16px",
  },

  dots: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "20px",
  },

  dot: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
  },

  title: {
    textAlign: "center",
    fontSize: "72px",
    marginBottom: "40px",
    color: "#111",
  },

  cardGrande: {
  background: "white",
  borderRadius: "32px",
  padding: "clamp(18px, 4vw, 30px)",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px",
  marginBottom: "40px",
},

  info: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  subtitulo: {
    fontSize: "38px",
    color: "#111",
  },

  texto: {
    fontSize: "22px",
    lineHeight: "1.6",
    color: "#333",
  },

  gridContainer: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  grid10: {
    width: "320px",
    height: "320px",
    display: "grid",
    gridTemplateColumns: "repeat(10,1fr)",
    gridTemplateRows: "repeat(10,1fr)",
    border: "2px solid #ddd",
    position: "relative",
  },

  cell: {
    border: "1px solid #eee",
  },

  square: {
    position: "absolute",
    inset: "40px",
    border: "4px solid #cc7548",
  },

  cmTop: {
    position: "absolute",
    top: "-30px",
    fontSize: "24px",
  },

  cmSide: {
    position: "absolute",
    right: "-70px",
    fontSize: "24px",
    transform: "rotate(90deg)",
  },

  counterArea: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "40px",
  },

  counterBox: {
    textAlign: "center",
  },

  counterTitle: {
    fontSize: "24px",
    marginBottom: "20px",
  },

  counterRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
  },

  minus: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "2px solid #cc7548",
    background: "white",
    fontSize: "34px",
    cursor: "pointer",
    color: "#cc7548",
  },

  plus: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "2px solid #cc7548",
    background: "white",
    fontSize: "34px",
    cursor: "pointer",
    color: "#cc7548",
  },

  minusGreen: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "2px solid #88aa92",
    background: "white",
    fontSize: "34px",
    cursor: "pointer",
    color: "#88aa92",
  },

  plusGreen: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "2px solid #88aa92",
    background: "white",
    fontSize: "34px",
    cursor: "pointer",
    color: "#88aa92",
  },

  numberOrange: {
    fontSize: "72px",
    color: "#cc7548",
    fontWeight: "bold",
  },

  numberGreen: {
    fontSize: "72px",
    color: "#88aa92",
    fontWeight: "bold",
  },

  separator: {
    height: "1px",
    background: "#ddd",
  },

  grid2: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "24px",
},

  card: {
    background: "white",
    borderRadius: "28px",
    padding: "30px",
  },

  sectionTitle: {
    fontSize: "38px",
    marginBottom: "30px",
  },

  label: {
    fontSize: "22px",
    marginBottom: "16px",
  },

  options: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "30px",
  },

  optionButton: {
    border: "2px solid #eadfce",
    borderRadius: "18px",
    padding: "12px 20px",
    cursor: "pointer",
    fontSize: "18px",
  },

  textarea: {
    width: "100%",
    height: "160px",
    borderRadius: "20px",
    border: "2px solid #eadfce",
    padding: "20px",
    fontSize: "18px",
    marginBottom: "20px",
  },

  saveButton: {
    width: "100%",
    background: "#cc7548",
    color: "white",
    border: "none",
    borderRadius: "20px",
    padding: "20px",
    fontSize: "22px",
    cursor: "pointer",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
    fontSize: "22px",
  },

  input: {
    padding: "16px",
    borderRadius: "16px",
    border: "2px solid #eadfce",
    fontSize: "20px",
  },

  alert: {
    background: "#eef4ee",
    borderRadius: "20px",
    padding: "24px",
    fontSize: "22px",
    marginTop: "20px",
    lineHeight: "1.6",
  },

  scaleCard: {
    background: "#f8f4ee",
    borderRadius: "20px",
    padding: "24px",
    marginTop: "20px",
    fontSize: "24px",
    lineHeight: "1.6",
  },
};