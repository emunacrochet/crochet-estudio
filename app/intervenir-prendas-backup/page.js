"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function ImagenBiblioteca({ categoria, prefijo, numero, onClick }) {
  const posibles = [
    `/png/${categoria}/${prefijo}-${numero}.png`,
    `/png/${categoria}/${prefijo}-${numero}.jpg`,
    `/png/${categoria}/${numero}.png`,
    `/png/${categoria}/${numero}.jpg`,
    `/png/${categoria}/${prefijo}${numero}.png`,
    `/png/${categoria}/${prefijo}${numero}.jpg`,
  ];

  const [intento, setIntento] = useState(0);

  if (intento >= posibles.length) {
    return null;
  }

  return (
    <button style={libraryCard} onClick={() => onClick(posibles[intento])}>
      <img
        src={posibles[intento]}
        alt=""
        style={libraryImage}
        onError={() => setIntento(intento + 1)}
      />
    </button>
  );
}

export default function IntervenirPrendas() {
  const [ideaSeleccionada, setIdeaSeleccionada] = useState(null);
  const [baseImage, setBaseImage] = useState(null);
  const [categoria, setCategoria] = useState("flores");
  const [elementos, setElementos] = useState([]);
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    const idea = localStorage.getItem("ideaSeleccionada");
    if (idea) setIdeaSeleccionada(JSON.parse(idea));
  }, []);

  const categorias = {
    flores: { nombre: "Flores", prefijo: "flor" },
    bolsillos: { nombre: "Bolsillos", prefijo: "bolsillo" },
    bordes: { nombre: "Bordes", prefijo: "borde" },
    cuellos: { nombre: "Cuellos", prefijo: "cuello" },
    grannys: { nombre: "Grannys", prefijo: "granny" },
    punos: { nombre: "Puños", prefijo: "puño" },
  };

  const numeros = Array.from({ length: 10 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  function subirBase(e) {
    const file = e.target.files?.[0];
    if (file) setBaseImage(URL.createObjectURL(file));
  }

  function agregarElemento(src) {
    setElementos([
      ...elementos,
      {
        id: Date.now(),
        src,
        x: 120,
        y: 120,
        size: 120,
        rotate: 0,
      },
    ]);
  }

  function moverElemento(e) {
    if (!dragId) return;

    const rect = e.currentTarget.getBoundingClientRect();

    setElementos(
      elementos.map((el) =>
        el.id === dragId
          ? {
              ...el,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            }
          : el
      )
    );
  }

  function cambiarTamano(id, accion) {
    setElementos(
      elementos.map((el) =>
        el.id === id
          ? {
              ...el,
              size: accion === "mas" ? el.size + 15 : Math.max(40, el.size - 15),
            }
          : el
      )
    );
  }

  function girarElemento(id) {
    setElementos(
      elementos.map((el) =>
        el.id === id ? { ...el, rotate: el.rotate + 15 } : el
      )
    );
  }

  function borrarElemento(id) {
    setElementos(elementos.filter((el) => el.id !== id));
  }

  function quitarSoloImagenInspiracion() {
    const nuevaIdea = { ...ideaSeleccionada, imagen: "" };
    setIdeaSeleccionada(nuevaIdea);
    localStorage.setItem("ideaSeleccionada", JSON.stringify(nuevaIdea));
  }

  function quitarInspiracionCompleta() {
    localStorage.removeItem("ideaSeleccionada");
    setIdeaSeleccionada(null);
  }

  return (
    <main style={page}>
      <Link href="/">
        <button style={backButton}>← Volver al inicio</button>
      </Link>

      <h1 style={title}>Intervenir prendas con crochet</h1>

      {ideaSeleccionada && (
        <section style={card}>
          <h2 style={h2}>Inspiración seleccionada</h2>

          {ideaSeleccionada.imagen && (
            <div style={imageBlock}>
              <img
                src={ideaSeleccionada.imagen}
                alt=""
                style={inspirationImage}
              />

              <button style={deleteButton} onClick={quitarSoloImagenInspiracion}>
                Quitar solo imagen
              </button>
            </div>
          )}

          <h3>{ideaSeleccionada.titulo}</h3>

          <p>
            <strong>Transformación:</strong> {ideaSeleccionada.transformacion}
          </p>

          <p>
            <strong>Aplicación:</strong> {ideaSeleccionada.aplicacion}
          </p>

          <p>{ideaSeleccionada.nota}</p>

          <button style={smallDelete} onClick={quitarInspiracionCompleta}>
            Quitar inspiración completa
          </button>
        </section>
      )}

      <section style={card}>
        <h2 style={h2}>1. Subí la prenda a intervenir</h2>

        <input type="file" accept="image/*" onChange={subirBase} />

        <div
          style={workspace}
          onMouseMove={moverElemento}
          onMouseUp={() => setDragId(null)}
          onMouseLeave={() => setDragId(null)}
        >
          {baseImage ? (
            <img src={baseImage} alt="" style={basePhoto} />
          ) : (
            <p style={emptyText}>Subí una foto de la prenda.</p>
          )}

          {elementos.map((el) => (
            <div
              key={el.id}
              style={{
                ...placedElement,
                left: el.x,
                top: el.y,
                width: el.size,
                transform: `translate(-50%, -50%) rotate(${el.rotate}deg)`,
              }}
              onMouseDown={() => setDragId(el.id)}
            >
              <img src={el.src} alt="" style={placedImage} />

              <div style={miniTools}>
                <button style={miniButton} onClick={() => cambiarTamano(el.id, "menos")}>
                  −
                </button>

                <button style={miniButton} onClick={() => cambiarTamano(el.id, "mas")}>
                  +
                </button>

                <button style={miniButton} onClick={() => girarElemento(el.id)}>
                  ↻
                </button>

                <button style={miniDelete} onClick={() => borrarElemento(el.id)}>
                  x
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={card}>
        <h2 style={h2}>2. Biblioteca Emuná</h2>

        <div style={tabs}>
          {Object.entries(categorias).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setCategoria(key)}
              style={{
                ...tab,
                background: categoria === key ? "#111" : "white",
                color: categoria === key ? "white" : "#111",
              }}
            >
              {item.nombre}
            </button>
          ))}
        </div>

        <p style={hint}>
          Tocá una imagen para agregarla sobre la prenda. Después podés moverla con el mouse.
        </p>

        <div style={libraryGrid}>
          {numeros.map((numero) => (
            <ImagenBiblioteca
              key={`${categoria}-${numero}`}
              categoria={categoria}
              prefijo={categorias[categoria].prefijo}
              numero={numero}
              onClick={agregarElemento}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f5f1ea",
  padding: "36px 20px",
  fontFamily: "Georgia, serif",
  color: "#222",
};

const backButton = {
  background: "#111",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "14px",
  cursor: "pointer",
  marginBottom: "28px",
  fontWeight: "bold",
};

const title = {
  fontSize: "58px",
  marginBottom: "30px",
};

const h2 = {
  fontSize: "34px",
  marginBottom: "20px",
};

const card = {
  background: "white",
  borderRadius: "28px",
  padding: "28px",
  marginBottom: "30px",
};

const imageBlock = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginBottom: "18px",
};

const inspirationImage = {
  width: "100%",
  maxWidth: "360px",
  borderRadius: "18px",
};

const workspace = {
  position: "relative",
  minHeight: "560px",
  background: "#f0ece5",
  borderRadius: "24px",
  marginTop: "24px",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const basePhoto = {
  maxWidth: "100%",
  maxHeight: "560px",
  objectFit: "contain",
};

const emptyText = {
  fontSize: "22px",
  color: "#777",
};

const placedElement = {
  position: "absolute",
  cursor: "move",
  zIndex: 5,
};

const placedImage = {
  width: "100%",
  display: "block",
  pointerEvents: "none",
};

const miniTools = {
  display: "flex",
  gap: "5px",
  justifyContent: "center",
  marginTop: "6px",
};

const miniButton = {
  border: "none",
  background: "#111",
  color: "white",
  borderRadius: "8px",
  padding: "4px 8px",
  cursor: "pointer",
};

const miniDelete = {
  border: "none",
  background: "#d88f7a",
  color: "white",
  borderRadius: "8px",
  padding: "4px 8px",
  cursor: "pointer",
};

const tabs = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const tab = {
  border: "none",
  borderRadius: "999px",
  padding: "12px 20px",
  cursor: "pointer",
  fontSize: "18px",
  fontWeight: "bold",
};

const hint = {
  fontSize: "18px",
  color: "#555",
  marginBottom: "20px",
};

const libraryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: "14px",
};

const libraryCard = {
  background: "#f5f1ea",
  border: "none",
  borderRadius: "18px",
  padding: "10px",
  cursor: "pointer",
};

const libraryImage = {
  width: "100%",
  height: "110px",
  objectFit: "contain",
  display: "block",
};

const deleteButton = {
  background: "#d88f7a",
  color: "white",
  border: "none",
  padding: "11px 16px",
  borderRadius: "14px",
  cursor: "pointer",
  width: "fit-content",
  fontWeight: "bold",
};

const smallDelete = {
  background: "#f0d6cf",
  color: "#8f2d20",
  border: "none",
  padding: "9px 12px",
  borderRadius: "12px",
  cursor: "pointer",
  marginTop: "10px",
};