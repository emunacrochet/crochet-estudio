"use client";
import AuthGuard from "../AuthGuard";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../SessionProvider";

export default function Pixelador() {
  const { session } = useSession();
  const canvasRef = useRef(null);

  const [imageUrl, setImageUrl] = useState(null);
  const [gridWidth, setGridWidth] = useState(28);
  const [gridHeight, setGridHeight] = useState(28);
  const [cellSize, setCellSize] = useState(14);
  const [pixels, setPixels] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [proyectoAbiertoId, setProyectoAbiertoId] = useState(null);
  const [guardandoAuto, setGuardandoAuto] = useState(false);

  useEffect(() => {
    const proyectoAbierto = localStorage.getItem("pixeladorProyectoAbierto");

    if (!proyectoAbierto) return;
  if (!proyectoAbierto) return;

  const contenido = JSON.parse(proyectoAbierto);
setProyectoAbiertoId(contenido.id || null);
setNombreProyecto(contenido.nombre || "");
  setPixels(contenido.pixels || []);
  setColors(contenido.colors || []);
  setGridWidth(contenido.gridWidth || 28);
  setGridHeight(contenido.gridHeight || 28);
setImageUrl("proyecto-guardado");
  localStorage.removeItem("pixeladorProyectoAbierto");
}, []);
useEffect(() => {

  if (!proyectoAbiertoId) return;

  const temporizador = setTimeout(() => {

    guardarProyectoAutomatico();

  }, 5000);

  return () => clearTimeout(temporizador);

}, [
  pixels,
  colors,
  gridWidth,
  gridHeight,
  nombreProyecto,
]);
async function guardarProyectoAutomatico() {

  if (!session || !proyectoAbiertoId) return;

  setGuardandoAuto(true);

  const { error } = await supabase
    .from("proyectos")
    .update({
      nombre: nombreProyecto || "Sin nombre",
      contenido: {
        pixels,
        colors,
        gridWidth,
        gridHeight,
      },
      tipo: "pixelador",
    })
    .eq("id", proyectoAbiertoId)
    .eq("user_id", session.user.id);

  setGuardandoAuto(false);

  if (error) {
    console.log("Error en autoguardado:", error);
  }
}
async function guardarProyecto() {
  if (!session) return;

  const datosProyecto = {
    user_id: session.user.id,
    nombre: nombreProyecto || "Sin nombre",
    contenido: {
      pixels,
      colors,
      gridWidth,
      gridHeight,
    },
    tipo: "pixelador",
  };

  let error;

  if (proyectoAbiertoId) {
    const resultado = await supabase
      .from("proyectos")
      .update(datosProyecto)
      .eq("id", proyectoAbiertoId)
      .eq("user_id", session.user.id);

    error = resultado.error;
  } else {
    const resultado = await supabase
      .from("proyectos")
      .insert([datosProyecto])
      .select("id")
      .single();

    error = resultado.error;

    if (resultado.data?.id) {
      setProyectoAbiertoId(resultado.data.id);
    }
  }

  if (error) {
    alert("Error al guardar");
  } else {
    alert(proyectoAbiertoId ? "Proyecto actualizado" : "Proyecto guardado");
  }
}
    
  function subirImagen(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const url = URL.createObjectURL(archivo);
    setImageUrl(url);

    const img = new Image();
    img.src = url;

    img.onload = () => {
      const ratio = img.height / img.width;
      const altoCalculado = Math.max(10, Math.round(gridWidth * ratio));
      setGridHeight(altoCalculado);
      generarPixeles(img, gridWidth, altoCalculado);
    };
  }

  function generarPixeles(img, ancho, alto) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = ancho;
    canvas.height = alto;

    ctx.clearRect(0, 0, ancho, alto);
    ctx.drawImage(img, 0, 0, ancho, alto);

    const data = ctx.getImageData(0, 0, ancho, alto).data;
    const nuevosPixeles = [];
    const coloresDetectados = [];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      const color = a === 0 ? "transparent" : `rgb(${r}, ${g}, ${b})`;

      nuevosPixeles.push(color);

      if (
        color !== "transparent" &&
        !coloresDetectados.includes(color) &&
        coloresDetectados.length < 18
      ) {
        coloresDetectados.push(color);
      }
    }

    setPixels(nuevosPixeles);
    setColors(coloresDetectados);
    setSelectedColor(coloresDetectados[0] || null);
  }

  function recalcular(anchoNuevo, altoNuevo = gridHeight) {
    setGridWidth(anchoNuevo);
    setGridHeight(altoNuevo);

    if (!imageUrl) return;

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      generarPixeles(img, anchoNuevo, altoNuevo);
    };
  }

  function cambiarPixel(index) {
    if (!selectedColor) return;

    const nuevos = [...pixels];
    nuevos[index] = selectedColor;
    setPixels(nuevos);
  }

  function agregarColorManual(e) {
    const color = e.target.value;
    setSelectedColor(color);

    if (!colors.includes(color)) {
      setColors([color, ...colors]);
    }
  }

  function descargarPNG() {
    if (!pixels.length) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = gridWidth * cellSize;
    canvas.height = gridHeight * cellSize;

    pixels.forEach((color, index) => {
      const x = index % gridWidth;
      const y = Math.floor(index / gridWidth);

      ctx.fillStyle = color;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

      if (showGrid) {
        ctx.strokeStyle = "#999";
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    });

    const link = document.createElement("a");
    link.download = "pixelado-emuna.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (


  <AuthGuard>
    <div style={saveBox}>

  <input
    type="text"
    placeholder="Nombre del proyecto"
    value={nombreProyecto}
    onChange={(e) => setNombreProyecto(e.target.value)}
    style={saveInput}
  />

  <button
    onClick={guardarProyecto}
    style={saveButton}
  >
    Guardar proyecto
  </button>
guardandoAuto  

  <span style={autoSaveText}>
    Guardando automáticamente...
  </span>
)
</div>
    <main style={page}>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <Link href="/">
        <button style={backButton}>← Volver al inicio</button>
      </Link>

      <h1 style={title}>Pixelador</h1>

      <p style={intro}>
        Subí una imagen y convertíla en una guía pixelada sin deformar la proporción.
      </p>

      <section style={card}>
        <h2 style={sectionTitle}>1. Subí tu imagen</h2>
        <input type="file" accept="image/*" onChange={subirImagen} />
      </section>

      {imageUrl && (
        <section style={layout}>
          <div style={previewCard}>
            <h2 style={sectionTitle}>Imagen original</h2>
            <img src={imageUrl} alt="" style={previewImage} />
          </div>

          <div style={controls}>
            <h2 style={sectionTitle}>Ajustes</h2>

            <label style={label}>
              Ancho en puntos
              <input
                type="range"
                min="10"
                max="80"
                value={gridWidth}
                onChange={(e) => {
                  const nuevoAncho = Number(e.target.value);
                  if (!imageUrl) return;

                  const img = new Image();
                  img.src = imageUrl;

                  img.onload = () => {
                    const ratio = img.height / img.width;
                    const nuevoAlto = Math.max(10, Math.round(nuevoAncho * ratio));
                    recalcular(nuevoAncho, nuevoAlto);
                  };
                }}
                style={range}
              />
              <strong>
                {gridWidth} columnas × {gridHeight} hileras
              </strong>
            </label>

            <label style={label}>
              Zoom del cuadrito
              <input
                type="range"
                min="8"
                max="28"
                value={cellSize}
                onChange={(e) => setCellSize(Number(e.target.value))}
                style={range}
              />
              <strong>{cellSize}px</strong>
            </label>

            <div style={buttonRow}>
              <button
                style={darkButton}
                onClick={() => setShowGrid(!showGrid)}
              >
                {showGrid ? "Ocultar cuadrícula" : "Mostrar cuadrícula"}
              </button>

              <button style={orangeButton} onClick={descargarPNG}>
                Descargar PNG
              </button>
            </div>
          </div>
        </section>
      )}

      {imageUrl && (
        <section style={card}>
          <h2 style={sectionTitle}>Colores detectados</h2>

          <div style={palette}>
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                style={{
                  ...colorButton,
                  background: color,
                  outline:
                    selectedColor === color
                      ? "4px solid #111"
                      : "1px solid #ddd",
                }}
              />
            ))}

            <label style={manualColor}>
              Color manual
              <input type="color" onChange={agregarColorManual} />
            </label>
          </div>

          <p style={hint}>
            Elegí un color y tocá un cuadrito para corregirlo.
          </p>
        </section>
      )}

      {pixels.length > 0 && (
        <section style={card}>
          <h2 style={sectionTitle}>2. Cuadrícula pixelada</h2>

          <div style={gridWrapper}>
            <div
              style={{
                ...pixelGrid,
                gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
              }}
            >
              {pixels.map((color, index) => (
                <button
                  key={index}
                  onClick={() => cambiarPixel(index)}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: color,
                    border: showGrid ? "1px solid #999" : "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
    </AuthGuard>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f5f1ea",
  padding: "clamp(24px, 5vw, 40px) clamp(16px, 4vw, 24px)",
  fontFamily: "Georgia, serif",
  color: "#222",
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
  fontSize: "clamp(38px, 8vw, 72px)",
  marginBottom: "14px",
  lineHeight: "1.1",
};

const intro = {
  fontSize: "clamp(18px, 4vw, 24px)",
  lineHeight: "1.6",
  maxWidth: "900px",
  marginBottom: "30px",
};

const card = {
  background: "white",
  borderRadius: "28px",
  padding: "clamp(20px, 5vw, 30px)",
  marginBottom: "30px",
};

const sectionTitle = {
  fontSize: "clamp(24px, 5vw, 34px)",
  marginBottom: "18px",
};

const layout = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "24px",
  alignItems: "start",
  marginBottom: "30px",
};

const previewCard = {
  background: "white",
  borderRadius: "28px",
  padding: "24px",
};

const previewImage = {
  width: "100%",
  maxHeight: "340px",
  objectFit: "contain",
  borderRadius: "20px",
  display: "block",
};

const controls = {
  background: "white",
  borderRadius: "28px",
  padding: "24px",
};

const label = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  fontSize: "18px",
  marginBottom: "22px",
};

const range = {
  width: "100%",
};

const buttonRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const darkButton = {
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: "14px",
  padding: "14px 18px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
};

const orangeButton = {
  background: "#c96f43",
  color: "white",
  border: "none",
  borderRadius: "14px",
  padding: "14px 18px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
};

const palette = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  alignItems: "center",
};

const colorButton = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  border: "none",
  cursor: "pointer",
};

const manualColor = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  fontSize: "18px",
};

const hint = {
  fontSize: "17px",
  color: "#666",
  marginTop: "16px",
};

const gridWrapper = {
  width: "100%",
  overflowX: "auto",
  paddingBottom: "10px",
};

const pixelGrid = {
  display: "grid",
  width: "fit-content",
  margin: "0 auto",
  background: "#f5f1ea",
  border: "1px solid #ddd",
};
const saveBox = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "24px",
};

const saveInput = {
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid #d8cdc3",
  minWidth: "240px",
  fontSize: "16px",
};

const saveButton = {
  padding: "14px 20px",
  borderRadius: "14px",
  border: "none",
  background: "#3f2e27",
  color: "white",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
};
const autoSaveText = {
  color: "#6b625d",
  fontSize: "15px",
  fontStyle: "italic",
};
 