"use client";
import AuthGuard from "../AuthGuard";
import Link from "next/link";
import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../SessionProvider";
const categorias = [
  { key: "flores", label: "Flores", folder: "flores" },
  { key: "bolsillos", label: "Bolsillos", folder: "bolsillos" },
  { key: "bordes", label: "Bordes", folder: "bordes" },
  { key: "cuellos", label: "Cuellos", folder: "cuellos" },
  { key: "grannys", label: "Grannys", folder: "grannys" },
  { key: "punos", label: "Puños", folder: "puños" },
];

export default function IntervenirPrendas() {
  const areaRef = useRef(null);
const { session } = useSession();
  const [categoriaActiva, setCategoriaActiva] = useState(categorias[0]);
  const [prenda, setPrenda] = useState(null);
  const [elementos, setElementos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [notas, setNotas] = useState("");

  const numeros = Array.from({ length: 20 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  function subirPrenda(e) {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    setPrenda(URL.createObjectURL(archivo));
  }

  function agregarElemento(src) {
    const nuevo = {
      id: Date.now(),
      src,
      x: 180,
      y: 180,
      size: 120,
    };

    setElementos([...elementos, nuevo]);
    setSeleccionado(nuevo.id);
  }
function subirDetalleCrochet(e) {
  const archivo = e.target.files?.[0];

  if (!archivo) return;

  const url = URL.createObjectURL(archivo);

  agregarElemento(url);
}
  function moverElemento(id, x, y) {
    setElementos(
      elementos.map((el) =>
        el.id === id ? { ...el, x, y } : el
      )
    );
  }

  function borrarElemento(id) {
    setElementos(elementos.filter((el) => el.id !== id));

    if (seleccionado === id) {
      setSeleccionado(null);
    }
  }

  function cambiarTamano(id, cambio) {
    setElementos(
      elementos.map((el) =>
        el.id === id
          ? {
              ...el,
              size: Math.max(40, el.size + cambio),
            }
          : el
      )
    );
  }

  async function descargarDiseno() {
    const html2canvas = (await import("html2canvas")).default;

    if (!areaRef.current) return;

    const canvas = await html2canvas(areaRef.current, {
      backgroundColor: "#f0ece5",
      useCORS: true,
    });

    const link = document.createElement("a");

    link.download = "intervencion-prenda-emuna.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function enviarAMiProyecto() {
    const html2canvas = (await import("html2canvas")).default;

    if (!areaRef.current) return;

    const canvas = await html2canvas(areaRef.current, {
      backgroundColor: "#f0ece5",
      useCORS: true,
    });

    const imagenFinal = canvas.toDataURL("image/png");

    localStorage.setItem(
      "intervencionActual",
      JSON.stringify({
        imagen: imagenFinal,
        notas,
        fecha: new Date().toLocaleDateString(),
      })
    );

    window.location.href = "/mi-proyecto";
  }
async function guardarIntervencionComoProyecto() {
  if (!session) {
    alert("Debés iniciar sesión");
    return;
  }

  if (!areaRef.current) {
    alert("Primero creá una intervención");
    return;
  }

  const html2canvas = (await import("html2canvas")).default;

  const canvas = await html2canvas(areaRef.current, {
    backgroundColor: "#f0ece5",
    useCORS: true,
  });

  const imagenFinal = canvas.toDataURL("image/png");

  const { error } = await supabase
    .from("proyectos")
    .insert([
      {
        user_id: session.user.id,
        nombre: "Intervención de prenda",
        contenido: {
          imagen: imagenFinal,
          notas,
          fecha: new Date().toLocaleDateString(),
        },
        tipo: "intervencion-prenda",
      },
    ]);

  if (error) {
    alert("Error al guardar la intervención");
  } else {
    alert("Intervención guardada como proyecto");
  }
}
  return (
  <AuthGuard>
    <main style={page}>
      <Link href="/">
        <button style={backButton}>← Volver al inicio</button>
      </Link>

      <h1 style={title}>Intervenir prendas con crochet</h1>

      <section style={card}>
        <h2 style={sectionTitle}>1. Subí tu prenda</h2>

        <input type="file" accept="image/*" onChange={subirPrenda} />

        <div style={workspaceWrapper}>
          <div ref={areaRef} style={workspace} data-workspace>
            {prenda ? (
              <img src={prenda} alt="" style={baseImage} />
            ) : (
              <p style={emptyText}>
                Subí una imagen para comenzar.
              </p>
            )}

            {elementos.map((el) => (
              <DraggableItem
                key={el.id}
                elemento={el}
                moverElemento={moverElemento}
                setSeleccionado={setSeleccionado}
              />
            ))}
          </div>

          <div style={sidePanel}>
            <h3 style={panelTitle}>Herramientas</h3>

            {seleccionado ? (
              <>
                <button
                  style={panelButton}
                  onClick={() => cambiarTamano(seleccionado, -15)}
                >
                  Reducir
                </button>

                <button
                  style={panelButton}
                  onClick={() => cambiarTamano(seleccionado, 15)}
                >
                  Agrandar
                </button>

                <button
                  style={deleteButton}
                  onClick={() => borrarElemento(seleccionado)}
                >
                  Eliminar aplique
                </button>
              </>
            ) : (
              <p style={panelText}>
                Seleccioná un aplique.
              </p>
            )}

            <button
              style={projectSaveButton}
              onClick={enviarAMiProyecto}
            >
              Enviar a Mi Proyecto
            </button>

            <button
              style={downloadButton}
              onClick={descargarDiseno}
            >
              Descargar diseño
            </button>
          </div>
        </div>
      </section>

      <section style={card}>
        <h2 style={sectionTitle}>Anotaciones</h2>
<div style={uploadDetailBox}>
  <label style={uploadLabel}>
    Subir mi detalle crochet

    <input
      type="file"
      accept="image/*"
      onChange={subirDetalleCrochet}
      style={{ display: "none" }}
    />
  </label>

  <p style={uploadText}>
    Subí una flor, granny, bolsillo, borde o aplique propio para probarlo sobre la prenda.
  </p>
</div>
        <textarea
          style={notesArea}
          placeholder="Escribí ideas, cambios, colores, materiales o detalles para recordar..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </section>

      <section style={card}>
        <h2 style={sectionTitle}>2. Biblioteca Emuná</h2>

        <div style={tabs}>
          {categorias.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoriaActiva(cat)}
              style={{
                ...tab,
                background:
                  categoriaActiva.key === cat.key
                    ? "#111"
                    : "white",

                color:
                  categoriaActiva.key === cat.key
                    ? "white"
                    : "#111",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={miniGrid}>
          {numeros.map((numero) => (
            <Miniatura
              key={`${categoriaActiva.key}-${numero}`}
              src={`/png/${categoriaActiva.folder}/${numero}.png`}
              onClick={agregarElemento}
            />
          ))}
        </div>
      </section>
        </main>
  </AuthGuard>
);
}

function Miniatura({ src, onClick }) {
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <button style={miniCard} onClick={() => onClick(src)}>
      <img
        src={src}
        alt=""
        style={miniImage}
        onError={() => setError(true)}
      />
    </button>
  );
}

function DraggableItem({
  elemento,
  moverElemento,
  setSeleccionado,
}) {
  function iniciarMovimiento(e) {
    e.preventDefault();

    setSeleccionado(elemento.id);

    const workspace =
      e.currentTarget.closest("[data-workspace]");

    function mover(clientX, clientY) {
      const rect = workspace.getBoundingClientRect();

      moverElemento(
        elemento.id,
        clientX - rect.left,
        clientY - rect.top
      );
    }

    function mouseMove(event) {
      mover(event.clientX, event.clientY);
    }

    function touchMove(event) {
      mover(
        event.touches[0].clientX,
        event.touches[0].clientY
      );
    }

    function detener() {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", detener);

      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", detener);
    }

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", detener);

    window.addEventListener("touchmove", touchMove);
    window.addEventListener("touchend", detener);
  }

  return (
    <div
      style={{
        ...placed,
        left: elemento.x,
        top: elemento.y,
        width: elemento.size,
      }}
      onMouseDown={iniciarMovimiento}
      onTouchStart={iniciarMovimiento}
    >
      <img src={elemento.src} alt="" style={placedImage} />
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f5f1ea",
  padding: "30px 20px",
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
};

const title = {
  fontSize: "clamp(34px, 6vw, 58px)",
  marginBottom: "30px",
  color: "#111",
  lineHeight: "1.1",
};

const card = {
  background: "white",
  borderRadius: "28px",
  padding: "24px",
  marginBottom: "30px",
};

const sectionTitle = {
  fontSize: "clamp(26px, 5vw, 34px)",
  marginBottom: "20px",
};

const workspaceWrapper = {
  display: "flex",
  flexWrap: "wrap",
  gap: "18px",
  marginTop: "24px",
  alignItems: "flex-start",
};

const workspace = {
  position: "relative",
  flex: "1 1 320px",
  width: "100%",
  minHeight: "520px",
  background: "#f0ece5",
  borderRadius: "24px",
  overflow: "hidden",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const sidePanel = {
  width: "100%",
  maxWidth: "220px",
  background: "#f5f1ea",
  borderRadius: "20px",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  flexShrink: 0,
};

const panelTitle = {
  fontSize: "24px",
  marginBottom: "10px",
};

const panelText = {
  color: "#666",
};

const panelButton = {
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "12px",
  cursor: "pointer",
  fontSize: "16px",
};

const deleteButton = {
  background: "#d88f7a",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "12px",
  cursor: "pointer",
  fontSize: "16px",
};

const projectSaveButton = {
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "12px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
};

const downloadButton = {
  background: "#6f8f72",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "12px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
};

const baseImage = {
  maxWidth: "100%",
  maxHeight: "620px",
  objectFit: "contain",
};

const emptyText = {
  color: "#777",
  fontSize: "22px",
};

const placed = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  cursor: "grab",
  touchAction: "none",
};

const placedImage = {
  width: "100%",
  display: "block",
  pointerEvents: "none",
};

const notesArea = {
  width: "100%",
  minHeight: "150px",
  padding: "16px",
  borderRadius: "18px",
  border: "1px solid #ddd",
  fontSize: "18px",
  fontFamily: "Georgia, serif",
};

const tabs = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const tab = {
  border: "none",
  borderRadius: "999px",
  padding: "10px 18px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
};

const miniGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
  gap: "12px",
  maxHeight: "320px",
  overflowY: "auto",
};

const miniCard = {
  background: "#f5f1ea",
  border: "none",
  borderRadius: "14px",
  padding: "8px",
  cursor: "pointer",
};

const miniImage = {
  width: "100%",
  height: "80px",
  objectFit: "contain",
};
const uploadDetailBox = {
  background: "#f8f3ed",
  borderRadius: "18px",
  padding: "16px",
  marginBottom: "20px",
  border: "1px solid #eadfd5",
};

const uploadLabel = {
  display: "inline-block",
  background: "#111",
  color: "white",
  borderRadius: "14px",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: "bold",
};

const uploadText = {
  color: "#6b625d",
  lineHeight: "1.5",
  marginTop: "12px",
};