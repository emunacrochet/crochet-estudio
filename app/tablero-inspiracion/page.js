"use client";
import AuthGuard from "../AuthGuard";
import Link from "next/link";
import { useState } from "react";

const ideas = [
  {
    categoria: "Prendas",
    titulo: "Prendas crochet modernas",
    texto: "Inspirate en formas, color y estructura.",
    busqueda: "crochet fashion modern",
  },
  {
    categoria: "Bolsos",
    titulo: "Bolsos crochet",
    texto: "Observá asas, composición y textura.",
    busqueda: "crochet bags aesthetic",
  },
  {
    categoria: "Hogar",
    titulo: "Mantas crochet",
    texto: "Analizá composición y paletas.",
    busqueda: "crochet blanket modern",
  },
  {
    categoria: "Granny",
    titulo: "Granny squares modernos",
    texto: "Uniones, color y distribución.",
    busqueda: "modern granny square",
  },
  {
    categoria: "Texturas",
    titulo: "Texturas crochet",
    texto: "Puntos con relieve y movimiento.",
    busqueda: "crochet texture stitch",
  },
  {
    categoria: "Vintage",
    titulo: "Crochet vintage",
    texto: "Detalles clásicos para reinterpretar.",
    busqueda: "crochet vintage aesthetic",
  },
];

export default function TableroInspiracion() {
  const [imagenes, setImagenes] = useState([]);

  function subirImagen(e) {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    const reader = new FileReader();

    reader.onload = () => {
      const nueva = {
        id: Date.now(),
        src: reader.result,
        titulo: "Inspiración guardada",
        nota: "Imagen subida desde Tablero Inspiracional",
        transformacion: "",
        aplicacion: "",
      };

      setImagenes([nueva, ...imagenes]);
    };

    reader.readAsDataURL(archivo);
  }

  function borrarImagen(id) {
    setImagenes(imagenes.filter((img) => img.id !== id));
  }

  function enviarAMiProyecto(img) {
    localStorage.setItem(
      "ideaSeleccionada",
      JSON.stringify({
        titulo: img.titulo,
        nota: img.nota,
        transformacion: img.transformacion,
        aplicacion: img.aplicacion,
        imagen: img.src,
      })
    );

    window.location.href = "/mi-proyecto";
  }

  function enviarAIntervenir(img) {
    localStorage.setItem(
      "ideaSeleccionada",
      JSON.stringify({
        titulo: img.titulo,
        nota: img.nota,
        transformacion: img.transformacion,
        aplicacion: img.aplicacion,
        imagen: img.src,
      })
    );

    window.location.href = "/intervenir-prendas";
  }

  return (
  <AuthGuard>
    <main style={page}>
      <Link href="/">
        <button style={backButton}>← Volver al inicio</button>
      </Link>

      <h1 style={titulo}>Tablero Inspiracional</h1>

      <p style={descripcion}>
        Buscá inspiración crochet, analizá referencias visuales y transformalas
        en ideas propias.
      </p>

      <div style={uploadBox}>
        <p style={uploadText}>
          Buscás inspiración, hacés captura de pantalla o guardás la imagen y
          luego la subís aquí.
        </p>

        <input type="file" accept="image/*" onChange={subirImagen} />
      </div>

      <div style={tags}>
        {[
          "Todo",
          "Prendas",
          "Bolsos",
          "Hogar",
          "Granny",
          "Texturas",
          "Vintage",
          "Flores",
          "Tapices",
          "Bordes",
        ].map((tag, index) => (
          <button
            key={tag}
            style={{
              ...tagButton,
              background: index === 0 ? "#111" : "white",
              color: index === 0 ? "white" : "#111",
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <div style={grid}>
        {ideas.map((idea) => (
          <div key={idea.titulo} style={card}>
            <p style={categoria}>{idea.categoria}</p>

            <h2 style={cardTitle}>{idea.titulo}</h2>

            <p style={cardText}>{idea.texto}</p>

            <a
              href={`https://www.google.com/search?q=${idea.busqueda}&tbm=isch`}
              target="_blank"
            >
              <button style={searchButton}>Buscar imágenes</button>
            </a>
          </div>
        ))}
      </div>

      <section style={savedSection}>
        <h2 style={savedTitle}>Mis ideas guardadas</h2>

        {imagenes.length === 0 ? (
          <p style={emptyText}>Todavía no subiste imágenes.</p>
        ) : (
          <div style={savedGrid}>
            {imagenes.map((img) => (
              <div key={img.id} style={savedCard}>
                <img src={img.src} alt="" style={savedImage} />

                <div style={savedButtons}>
                  <button
                    style={projectButton}
                    onClick={() => enviarAMiProyecto(img)}
                  >
                    Mi Proyecto
                  </button>

                  <button
                    style={intervenirButton}
                    onClick={() => enviarAIntervenir(img)}
                  >
                    Intervenir
                  </button>

                  <button
                    style={deleteButton}
                    onClick={() => borrarImagen(img.id)}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </main>
  </AuthGuard>
);
}

const page = {
  minHeight: "100vh",
  background: "#f5f1ea",
  padding: "30px 16px",
  fontFamily: "Georgia, serif",
};

const backButton = {
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  cursor: "pointer",
  marginBottom: "24px",
  fontSize: "16px",
};

const titulo = {
  fontSize: "72px",
  color: "#111",
  marginBottom: "26px",
};

const descripcion = {
  fontSize: "28px",
  lineHeight: "1.6",
  color: "#222",
  marginBottom: "28px",
  maxWidth: "1000px",
};

const uploadBox = {
  background: "white",
  borderRadius: "24px",
  padding: "24px",
  marginBottom: "30px",
};

const uploadText = {
  fontSize: "24px",
  lineHeight: "1.6",
};

const tags = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "36px",
};

const tagButton = {
  border: "none",
  borderRadius: "999px",
  padding: "16px 22px",
  fontSize: "18px",
  cursor: "pointer",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "28px",
};

const card = {
  background: "white",
  borderRadius: "28px",
  padding: "30px",
};

const categoria = {
  fontSize: "18px",
  marginBottom: "14px",
};

const cardTitle = {
  fontSize: "34px",
  lineHeight: "1.3",
  marginBottom: "18px",
};

const cardText = {
  fontSize: "18px",
  lineHeight: "1.7",
  marginBottom: "24px",
};

const searchButton = {
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: "18px",
  padding: "16px 24px",
  cursor: "pointer",
  fontSize: "20px",
};

const savedSection = {
  marginTop: "60px",
};

const savedTitle = {
  fontSize: "58px",
  marginBottom: "26px",
};

const emptyText = {
  fontSize: "22px",
  color: "#666",
};

const savedGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "24px",
};

const savedCard = {
  background: "white",
  borderRadius: "26px",
  padding: "18px",
};

const savedImage = {
  width: "100%",
  borderRadius: "20px",
  marginBottom: "18px",
};

const savedButtons = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const projectButton = {
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: "14px",
  padding: "14px 18px",
  cursor: "pointer",
  fontSize: "18px",
};

const intervenirButton = {
  background: "#d88f7a",
  color: "white",
  border: "none",
  borderRadius: "14px",
  padding: "14px 18px",
  cursor: "pointer",
  fontSize: "18px",
};

const deleteButton = {
  background: "#777",
  color: "white",
  border: "none",
  borderRadius: "14px",
  padding: "14px 18px",
  cursor: "pointer",
  fontSize: "18px",
};