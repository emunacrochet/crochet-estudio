"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AuthGuard from "../AuthGuard";

const COLORS = {
  cream: "#F4F1EC",
  lilac: "#C9B6E4",
  mint: "#A8E0D1",
  pink: "#F6C9C1",
  charcoal: "#3F3F3F",
  white: "#FFFFFF",
  muted: "#746F6A",
  border: "#DED8D1",
};

const distance = (a, b) =>
  Math.sqrt(
    (a.r - b.r) ** 2 +
      (a.g - b.g) ** 2 +
      (a.b - b.b) ** 2
  );

function kMeans(pixels, amount) {
  if (!pixels.length) return [];

  const step = Math.max(1, Math.floor(pixels.length / amount));

  let centers = Array.from({ length: amount }, (_, index) => ({
    ...pixels[Math.min(index * step, pixels.length - 1)],
  }));

  for (let iteration = 0; iteration < 18; iteration += 1) {
    const totals = Array.from({ length: amount }, () => ({
      r: 0,
      g: 0,
      b: 0,
      count: 0,
    }));

    for (const pixel of pixels) {
      let bestIndex = 0;
      let bestDistance = Infinity;

      centers.forEach((center, index) => {
        const currentDistance = distance(pixel, center);

        if (currentDistance < bestDistance) {
          bestDistance = currentDistance;
          bestIndex = index;
        }
      });

      totals[bestIndex].r += pixel.r;
      totals[bestIndex].g += pixel.g;
      totals[bestIndex].b += pixel.b;
      totals[bestIndex].count += 1;
    }

    centers = totals.map((total, index) =>
      total.count
        ? {
            r: Math.round(total.r / total.count),
            g: Math.round(total.g / total.count),
            b: Math.round(total.b / total.count),
          }
        : centers[index]
    );
  }

  return centers;
}

function nearestColor(pixel, centers) {
  let bestIndex = 0;
  let bestDistance = Infinity;

  centers.forEach((center, index) => {
    const currentDistance = distance(pixel, center);

    if (currentDistance < bestDistance) {
      bestDistance = currentDistance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

export default function PatronesMosaicos() {
  const [mode, setMode] = useState("pixelated");
  const [imageSrc, setImageSrc] = useState("");
  const [columns, setColumns] = useState(40);
  const [rows, setRows] = useState(0);
  const [numberOfColors, setNumberOfColors] = useState(5);
  const [zoom, setZoom] = useState(18);
  const [xSize, setXSize] = useState(45);
  const [xColor, setXColor] = useState("#3F3F3F");
  const [showGrid, setShowGrid] = useState(true);
  const [tool, setTool] = useState("move");
  const [offsetX, setOffsetX] = useState(0);
const [offsetY, setOffsetY] = useState(0);
const dragStartRef = useRef(null);
const offsetStartRef = useRef({ x: 0, y: 0 });
  const [marks, setMarks] = useState(new Set());
  const [isDrawing, setIsDrawing] = useState(false);
  const [processedGrid, setProcessedGrid] = useState([]);
  const [palette, setPalette] = useState([]);
  const [processing, setProcessing] = useState(false);

  const fileRef = useRef(null);
  const canvasRef = useRef(null);
  const processingCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const lastCellRef = useRef(null);

  const calculateRows = useCallback(
    (image) => {
      if (!image?.width || !image?.height) return 10;

      return Math.max(
        5,
        Math.round(columns * (image.height / image.width))
      );
    },
    [columns]
  );

  const processImage = useCallback(() => {
    if (!imageSrc) return;

    const image = new Image();

    image.onload = () => {
      imageRef.current = image;

      const calculatedRows = calculateRows(image);
      setRows(calculatedRows);

      if (mode === "pixelated") {
        setProcessedGrid([]);
        setPalette([]);
        setProcessing(false);
        return;
      }

      setProcessing(true);

      const hiddenCanvas = processingCanvasRef.current;
      const context = hiddenCanvas.getContext("2d", {
        willReadFrequently: true,
      });

      hiddenCanvas.width = columns;
      hiddenCanvas.height = calculatedRows;

      context.clearRect(0, 0, columns, calculatedRows);
      context.drawImage(image, 0, 0, columns, calculatedRows);

      const imageData = context.getImageData(
        0,
        0,
        columns,
        calculatedRows
      ).data;

      const pixels = [];

      for (let index = 0; index < imageData.length; index += 4) {
        pixels.push({
          r: imageData[index],
          g: imageData[index + 1],
          b: imageData[index + 2],
        });
      }

      const sample = pixels.filter((_, index) => index % 3 === 0);
      const centers = kMeans(sample, numberOfColors);

      setPalette(centers);
      setProcessedGrid(
        pixels.map((pixel) => nearestColor(pixel, centers))
      );
      setProcessing(false);
    };

    image.onerror = () => {
      setProcessing(false);
    };

    image.src = imageSrc;
  }, [
    imageSrc,
    mode,
    columns,
    numberOfColors,
    calculateRows,
  ]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  useEffect(() => {
    setMarks(new Set());
  }, [imageSrc, columns, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !imageSrc || !rows || !image) return;

    canvas.width = columns * zoom;
    canvas.height = rows * zoom;

    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
context.save();
context.translate(offsetX, offsetY);
    if (mode === "common" && processedGrid.length) {
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column;
          const colorIndex = processedGrid[index];
          const color = palette[colorIndex];

          context.fillStyle = color
            ? `rgb(${color.r}, ${color.g}, ${color.b})`
            : "#EEEEEE";

          context.fillRect(
            column * zoom,
            row * zoom,
            zoom,
            zoom
          );
        }
      }
    } else {
      context.imageSmoothingEnabled = false;
        context.drawImage(
  image,
  0,
  0,
  columns * zoom,
  rows * zoom
      );
    }

    if (showGrid) {
      context.strokeStyle = "rgba(63, 63, 63, 0.30)";
      context.lineWidth = 1;

      for (let row = 0; row <= rows; row += 1) {
        context.beginPath();
        context.moveTo(0, row * zoom);
        context.lineTo(columns * zoom, row * zoom);
        context.stroke();
      }

      for (let column = 0; column <= columns; column += 1) {
        context.beginPath();
        context.moveTo(column * zoom, 0);
        context.lineTo(column * zoom, rows * zoom);
        context.stroke();
      }
    }

  
      context.restore();
  }, [
    imageSrc,
    rows,
    columns,
    zoom,
    mode,
    processedGrid,
    palette,
    showGrid,
    marks,
    xColor,
    xSize,
    offsetX,
   offsetY,
  ]);

  const uploadImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      setImageSrc(event.target.result);
      setMarks(new Set());
    };

    reader.readAsDataURL(file);
  };

  const getCell = (event) => {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    const rectangle = canvas.getBoundingClientRect();

const scaleX = canvas.width / rectangle.width;
const scaleY = canvas.height / rectangle.height;

const nativeEvent = event.nativeEvent ?? event;

const pointerX =
  nativeEvent.offsetX ??
  event.clientX - rectangle.left;

const pointerY =
  nativeEvent.offsetY ??
  event.clientY - rectangle.top;

const x = pointerX * scaleX;
const y = pointerY * scaleY;

    const column = Math.floor((x - offsetX) / zoom);
    const row = Math.floor((y - offsetY) / zoom);

    if (
      column < 0 ||
      column >= columns ||
      row < 0 ||
      row >= rows
    ) {
      return null;
    }

    return `${row}-${column}`;
  };

  const applyTool = (event) => {
    const cell = getCell(event);

    if (!cell || cell === lastCellRef.current) return;

    lastCellRef.current = cell;

    setMarks((previousMarks) => {
      const updatedMarks = new Set(previousMarks);

      if (tool === "mark") {
        updatedMarks.add(cell);
      } else {
        updatedMarks.delete(cell);
      }

      return updatedMarks;
    });
  };

   const startDrawing = (event) => {
  event.preventDefault();

  if (tool === "move") {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rectangle = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rectangle.width;
    const scaleY = canvas.height / rectangle.height;

    dragStartRef.current = {
      x: (event.clientX - rectangle.left) * scaleX,
      y: (event.clientY - rectangle.top) * scaleY,
    };

    offsetStartRef.current = {
      x: offsetX,
      y: offsetY,
    };

    return;
  }

  setIsDrawing(true);
  applyTool(event);
};

const continueDrawing = (event) => {
  event.preventDefault();

  if (tool === "move") {
    if (!dragStartRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rectangle = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rectangle.width;
    const scaleY = canvas.height / rectangle.height;

    const currentX = (event.clientX - rectangle.left) * scaleX;
    const currentY = (event.clientY - rectangle.top) * scaleY;

    setOffsetX(
      offsetStartRef.current.x + currentX - dragStartRef.current.x
    );
    setOffsetY(
      offsetStartRef.current.y + currentY - dragStartRef.current.y
    );

    return;
  }

  if (isDrawing) {
    applyTool(event);
  }
};

const stopDrawing = () => {
  setIsDrawing(false);
  lastCellRef.current = null;
  dragStartRef.current = null;
};

  const downloadPattern = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "patron-mosaico-emuna.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const resetImage = () => {
    setImageSrc("");
    setMarks(new Set());
    setProcessedGrid([]);
    setPalette([]);
    imageRef.current = null;

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const buttonStyle = (active = false, primary = false) => ({
    border: active || primary
      ? "1px solid transparent"
      : `1px solid ${COLORS.border}`,
    background: active
      ? COLORS.charcoal
      : primary
        ? COLORS.lilac
        : COLORS.white,
    color: active ? COLORS.white : COLORS.charcoal,
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  });

  const cardStyle = {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "14px",
    boxShadow: "0 3px 12px rgba(63, 63, 63, 0.06)",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: "6px",
  };

  return (
    <AuthGuard>
      <main
        style={{
          minHeight: "100vh",
          background: COLORS.cream,
          color: COLORS.charcoal,
          fontFamily: "Arial, sans-serif",
          padding: "22px 14px 50px",
        }}
      >
        <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
          <header style={{ marginBottom: "22px" }}>
            <h1
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(30px, 6vw, 48px)",
                margin: "0 0 8px",
              }}
            >
              Patrones Mosaicos
            </h1>

            <p
              style={{
                margin: 0,
                color: COLORS.muted,
                lineHeight: 1.6,
              }}
            >
              Subí tu imagen y marcá con una X los puntos que
              correspondan. Las marcas permanecen en su lugar aunque
              cambies el zoom.
            </p>
          </header>

          <section style={cardStyle}>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "19px",
                fontWeight: "700",
                marginBottom: "12px",
              }}
            >
              Elegí cómo querés trabajar
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => setMode("common")}
                style={{
                  ...buttonStyle(mode === "common"),
                  padding: "16px",
                  textAlign: "left",
                }}
              >
                <strong style={{ display: "block", marginBottom: "5px" }}>
                  Imagen común
                </strong>

                <span
                  style={{
                    display: "block",
                    fontWeight: "400",
                    lineHeight: 1.5,
                    opacity: 0.9,
                  }}
                >
                  Emuná convierte la imagen en una cuadrícula y reduce
                  la cantidad de colores.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("pixelated")}
                style={{
                  ...buttonStyle(mode === "pixelated"),
                  padding: "16px",
                  textAlign: "left",
                }}
              >
                <strong style={{ display: "block", marginBottom: "5px" }}>
                  Patrón ya pixelado
                </strong>

                <span
                  style={{
                    display: "block",
                    fontWeight: "400",
                    lineHeight: 1.5,
                    opacity: 0.9,
                  }}
                >
                  Conserva la imagen y coloca la cuadrícula y las X por
                  encima.
                </span>
              </button>
            </div>
          </section>

          {!imageSrc ? (
            <section
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                uploadImage(event.dataTransfer.files?.[0]);
              }}
              style={{
                ...cardStyle,
                minHeight: "260px",
                border: `2px dashed ${COLORS.lilac}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: COLORS.lilac,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  marginBottom: "14px",
                }}
              >
                +
              </div>

              <div
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "21px",
                  fontWeight: "700",
                  marginBottom: "7px",
                }}
              >
                Subí tu imagen
              </div>

              <div
                style={{
                  color: COLORS.muted,
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                Tocá aquí para elegirla desde tu galería.
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) =>
                  uploadImage(event.target.files?.[0])
                }
              />
            </section>
          ) : (
            <>
              <section style={cardStyle}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(145px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Columnas: {columns}
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="100"
                      value={columns}
                      onChange={(event) =>
                        setColumns(Number(event.target.value))
                      }
                      style={{ width: "100%", accentColor: COLORS.lilac }}
                    />
                  </div>

                  {mode === "common" && (
                    <div>
                      <label style={labelStyle}>
                        Colores: {numberOfColors}
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="12"
                        value={numberOfColors}
                        onChange={(event) =>
                          setNumberOfColors(Number(event.target.value))
                        }
                        style={{
                          width: "100%",
                          accentColor: COLORS.mint,
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label style={labelStyle}>Zoom: {zoom}</label>
                    <input
                      type="range"
                      min="8"
                      max="45"
                      value={zoom}
                      onChange={(event) =>
                        setZoom(Number(event.target.value))
                      }
                      style={{ width: "100%", accentColor: COLORS.pink }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Tamaño de la X: {xSize}%
                    </label>
                    <input
                      type="range"
                      min="35"
                      max="95"
                      value={xSize}
                      onChange={(event) =>
                        setXSize(Number(event.target.value))
                      }
                      style={{
                        width: "100%",
                        accentColor: COLORS.charcoal,
                      }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Color de la X</label>
                    <input
                      type="color"
                      value={xColor}
                      onChange={(event) => setXColor(event.target.value)}
                      style={{
                        width: "100%",
                        height: "38px",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "9px",
                        background: COLORS.white,
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "16px",
                    alignItems: "center",
                  }}
                >
                  <button
  type="button"
  onClick={() => setTool("move")}
  style={buttonStyle(tool === "move")}
>
  Mover imagen
</button>
                  <button
                    type="button"
                    onClick={() => setTool("mark")}
                    style={buttonStyle(tool === "mark")}
                  >
                    Marcar X
                  </button>

                  <button
                    type="button"
                    onClick={() => setTool("erase")}
                    style={buttonStyle(tool === "erase")}
                  >
                    Borrar X
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGrid((value) => !value)}
                    style={buttonStyle(showGrid)}
                  >
                    {showGrid ? "Ocultar cuadrícula" : "Mostrar cuadrícula"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarks(new Set())}
                    style={buttonStyle()}
                  >
                    Borrar todas
                  </button>

                  <button
                    type="button"
                    onClick={resetImage}
                    style={buttonStyle()}
                  >
                    Cambiar imagen
                  </button>

                  <button
                    type="button"
                    onClick={downloadPattern}
                    style={buttonStyle(false, true)}
                  >
                    Descargar patrón
                  </button>
                </div>

                <div
                  style={{
                    marginTop: "13px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background:
                      tool === "mark" ? COLORS.mint : COLORS.pink,
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  {tool === "mark"
                    ? "Tocá o arrastrá el dedo para agregar X."
                    : "Tocá o arrastrá el dedo sobre las X para borrarlas."}
                  <strong style={{ marginLeft: "8px" }}>
                    {marks.size} {marks.size === 1 ? "marca" : "marcas"}
                  </strong>
                </div>
              </section>

              {processing ? (
                <section
                  style={{
                    ...cardStyle,
                    textAlign: "center",
                    padding: "40px 20px",
                  }}
                >
                  Preparando la cuadrícula…
                </section>
              ) : (
                <section
                  style={{
                    ...cardStyle,
                    overflow: "auto",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <div
  style={{
    position: "relative",
    width: `${columns * zoom}px`,
    height: `${rows * zoom}px`,
  }}
>
  <canvas
    ref={canvasRef}
    onPointerDown={startDrawing}
    onPointerMove={continueDrawing}
    onPointerUp={stopDrawing}
    onPointerCancel={stopDrawing}
    onPointerLeave={stopDrawing}
    style={{
      display: "block",
      imageRendering: "pixelated",
      touchAction: "none",
      cursor: tool === "move" ? "grab" : "default",
      maxWidth: "none",
    }}
  />

  <div
    style={{
      position: "absolute",
      left: `${offsetX}px`,
      top: `${offsetY}px`,
      display: "grid",
gridTemplateColumns: `repeat(${columns}, 1fr)`,
gridTemplateRows: `repeat(${rows}, 1fr)`,
width: "100%",
height: "100%",
pointerEvents: tool === "move" ? "none" : "auto",
touchAction: "none",
}}
>
{Array.from({ length: rows }).map((_, row) =>
  Array.from({ length: columns }).map((_, column) => {
    const key = `${row}-${column}`;
    const marked = marks.has(key);

        return (
          <button
            key={key}
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();

              setMarks((previousMarks) => {
                const updatedMarks = new Set(previousMarks);
                if (tool === "mark") {
                updatedMarks.add(key);
                }

                if (tool === "erase") {
                  updatedMarks.delete(key);
                }

                return updatedMarks;
              });
            }}
            style={{
              width: "100%",
              height: "100%",
              padding: 0,
              margin: 0,
              border: "none",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: xColor,
              fontSize: `${Math.max(8, zoom * (xSize / 100))}px`,
              lineHeight: 1,
              fontFamily: "Arial, sans-serif",
              cursor: "crosshair",
            }}
          >
            {marked ? "×" : ""}
          </button>
        );
      })
    )}
  </div>
</div>
                </section>
              )}
            </>
          )}

          <canvas ref={processingCanvasRef} hidden />
        </div>
      </main>
    </AuthGuard>
  );
        }
