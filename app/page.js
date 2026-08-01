"use client";

import Link from "next/link";

export default function Home() {

  const herramientas = [
    {
      titulo: "Pixelador",
      descripcion:
        "Convertí imágenes en cuadrículas crochet.",
      link: "/pixelador",
    },

    {
      titulo: "Intervenir Prendas",
      descripcion:
        "Probá ideas y composiciones sobre prendas.",
      link: "/intervenir-prendas",
    },

    {
      titulo: "Muestra de Tensión",
      descripcion:
        "Calculá puntos y medidas para tus proyectos.",
      link: "/muestra-tension",
    },

    {
      titulo: "Tablero de Inspiración",
      descripcion:
        "Guardá referencias visuales y organizá ideas.",
      link: "/tablero-inspiracion",
    },

    {
      titulo: "Mi Proyecto",
      descripcion:
        "Desarrollá tus diseños y organizá procesos.",
      link: "/mi-proyecto",
    },

    {
      titulo: "Cuadrícula Crochet",
      descripcion:
        "Diseñá patrones con símbolos crochet.",
      link: "/cuadricula-crochet",
    },
  ];

  return (
    <main style={page}>

      <section style={hero}>

        <h1 style={titulo}>
          Emuná Studio
        </h1>

        <p style={subtitulo}>
          Herramientas para diseñar crochet con creatividad y criterio.
        </p>

      </section>

      <section style={grid}>

        {herramientas.map((item) => (

          <Link
            key={item.titulo}
            href={item.link}
            style={card}
          >

            <h2 style={cardTitulo}>
              {item.titulo}
            </h2>

            <p style={cardTexto}>
              {item.descripcion}
            </p>

          </Link>

        ))}

      </section>

    </main>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f5f1ea",
  padding: "clamp(24px, 5vw, 50px) clamp(16px, 4vw, 24px)",
  fontFamily: "Georgia, serif",
};

const hero = {
  textAlign: "center",
  marginBottom: "60px",
};

const titulo = {
  fontSize: "clamp(38px, 8vw, 68px)",
  color: "#2f221c",
  marginBottom: "14px",
  lineHeight: "1.1",
};

const subtitulo = {
  fontSize: "22px",
  color: "#6b625d",
  maxWidth: "700px",
  margin: "0 auto",
  lineHeight: "1.6",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "26px",
};

const card = {
  background: "white",
  padding: "clamp(20px, 5vw, 34px)",
  borderRadius: "26px",
  textDecoration: "none",
  border: "1px solid #eadfd5",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  transition: "0.2s",
};

const cardTitulo = {
  fontSize: "clamp(22px, 5vw, 30px)",
  color: "#3f2e27",
  marginBottom: "14px",
  lineHeight: "1.2",
};

const cardTexto = {
  color: "#6d625d",
  lineHeight: "1.7",
  fontSize: "clamp(15px, 3.8vw, 17px)",
};
