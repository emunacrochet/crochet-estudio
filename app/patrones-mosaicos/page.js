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

const NUMBER_GUTTER = 34;
const TOP_GUTTER = 28;
const MIN_ZOOM = 8;
const MAX_ZOOM = 48;

const distance = (a, b) =>
  Math.sqrt(
    (a.r - b.r) ** 2 +
      (a.g - b.g) ** 2 +
      (a.b - b.b) ** 2
  );

function kMeans(pixels, amount) {
  if (!pixels.length) return [];

  const step = Math.max(
    1,
    Math.floor(pixels.length / amount)
  );

  let centers = Array.from(
    { length: amount },
    (_, index) => ({
      ...pixels[
        Math.min(
          index * step,
          pixels.length - 1
        )
      ],
    })
  );

  for (
    let iteration = 0;
    iteration < 18;
    iteration += 1
  ) {
    const totals = Array.from(
      { length: amount },
      () => ({
        r: 0,
        g: 0,
        b: 0,
        count: 0,
      })
    );

    for (const pixel of pixels) {
      let bestIndex = 0;
      let bestDistance = Infinity;

      centers.forEach((center, index) => {
        const currentDistance = distance(
          pixel,
          center
        );

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
            r: Math.round(
              total.r / total.count
            ),
            g: Math.round(
              total.g / total.count
            ),
            b: Math.round(
              total.b / total.count
            ),
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
    const currentDistance = distance(
      pixel,
      center
    );

    if (currentDistance < bestDistance) {
      bestDistance = currentDistance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function clamp(value, minimum, maximum) {
  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}

function pointerDistance(first, second) {
  return Math.hypot(
    second.x - first.x,
    second.y - first.y
  );
}

function pointerCenter(first, second) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

export default function PatronesMosaicos() {
  const [mode, setMode] = useState(
    "pixelated"
  );
  const [imageSrc, setImageSrc] =
    useState("");
  const [columns, setColumns] =
    useState(40);
  const [rows, setRows] = useState(0);
  const [
    numberOfColors,
    setNumberOfColors,
  ] = useState(5);
  const [zoom, setZoom] = useState(18);
  const [xSize, setXSize] = useState(62);
  const [xColor, setXColor] = useState(
    "#3F3F3F"
  );
  const [showGrid, setShowGrid] =
    useState(true);
  const [tool, setTool] = useState("mark");
  const [marks, setMarks] = useState(
    new Set()
  );
  const [
    processedGrid,
    setProcessedGrid,
  ] = useState([]);
  const [palette, setPalette] =
    useState([]);
  const [processing, setProcessing] =
    useState(false);

  const [boardOffset, setBoardOffset] =
    useState({
      x: 0,
      y: 0,
    });

  const [
    controlsMinimized,
    setControlsMinimized,
  ] = useState(false);

  const [referenceOpen, setReferenceOpen] =
    useState(true);

  const [
    referenceMinimized,
    setReferenceMinimized,
  ] = useState(false);

  const [
    referencePosition,
    setReferencePosition,
  ] = useState({
    x: 18,
    y: 90,
  });

  const fileRef = useRef(null);
  const canvasRef = useRef(null);
  const processingCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const boardViewportRef = useRef(null);

  const activePointersRef = useRef(
    new Map()
  );
  const gestureRef = useRef(null);
  const draggedMarkRef = useRef(null);
  const dragPreviewRef = useRef(null);
  const lastPaintedCellRef = useRef(null);
  const suppressTapRef = useRef(false);

  const referenceDragRef = useRef(null);
  const referenceStartRef = useRef({
    x: 0,
    y: 0,
  });

  const calculateRows = useCallback(
    (image) => {
      if (!image?.width || !image?.height) {
        return 10;
      }

      return Math.max(
        5,
        Math.round(
          columns *
            (image.height / image.width)
        )
      );
    },
    [columns]
  );

  const processImage = useCallback(() => {
    if (!imageSrc) return;

    const image = new Image();

    image.onload = () => {
      imageRef.current = image;

      const calculatedRows =
        calculateRows(image);

      setRows(calculatedRows);

      if (mode === "pixelated") {
        setProcessedGrid([]);
        setPalette([]);
        setProcessing(false);
        return;
      }

      setProcessing(true);

      const hiddenCanvas =
        processingCanvasRef.current;

      if (!hiddenCanvas) {
        setProcessing(false);
        return;
      }

      const context =
        hiddenCanvas.getContext("2d", {
          willReadFrequently: true,
        });

      hiddenCanvas.width = columns;
      hiddenCanvas.height =
        calculatedRows;

      context.clearRect(
        0,
        0,
        columns,
        calculatedRows
      );

      context.drawImage(
        image,
        0,
        0,
        columns,
        calculatedRows
      );

      const imageData =
        context.getImageData(
          0,
          0,
          columns,
          calculatedRows
        ).data;

      const pixels = [];

      for (
        let index = 0;
        index < imageData.length;
        index += 4
      ) {
        pixels.push({
          r: imageData[index],
          g: imageData[index + 1],
          b: imageData[index + 2],
        });
      }

      const sample = pixels.filter(
        (_, index) => index % 3 === 0
      );

      const centers = kMeans(
        sample,
        numberOfColors
      );

      setPalette(centers);

      setProcessedGrid(
        pixels.map((pixel) =>
          nearestColor(pixel, centers)
        )
      );

      setProcessing(false);
    };

    image.onerror = () =>
      setProcessing(false);

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

    setBoardOffset({
      x: 0,
      y: 0,
    });
  }, [imageSrc, columns, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (
      !canvas ||
      !imageSrc ||
      !rows ||
      !image
    ) {
      return;
    }

    canvas.width = columns * zoom;
    canvas.height = rows * zoom;

    const context =
      canvas.getContext("2d");

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    context.imageSmoothingEnabled = false;

    if (
      mode === "common" &&
      processedGrid.length
    ) {
      for (
        let row = 0;
        row < rows;
        row += 1
      ) {
        for (
          let column = 0;
          column < columns;
          column += 1
        ) {
          const index =
            row * columns + column;

          const colorIndex =
            processedGrid[index];

          const color =
            palette[colorIndex];

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
      context.drawImage(
        image,
        0,
        0,
        columns * zoom,
        rows * zoom
      );
    }

    if (showGrid) {
      context.strokeStyle =
        "rgba(63, 63, 63, 0.32)";

      context.lineWidth = 1;

      for (
        let row = 0;
        row <= rows;
        row += 1
      ) {
        context.beginPath();
        context.moveTo(0, row * zoom);
        context.lineTo(
          columns * zoom,
          row * zoom
        );
        context.stroke();
      }

      for (
        let column = 0;
        column <= columns;
        column += 1
      ) {
        context.beginPath();
        context.moveTo(
          column * zoom,
          0
        );
        context.lineTo(
          column * zoom,
          rows * zoom
        );
        context.stroke();
      }
    }
  }, [
    imageSrc,
    rows,
    columns,
    zoom,
    mode,
    processedGrid,
    palette,
    showGrid,
  ]);

  const uploadImage = (file) => {
    if (
      !file ||
      !file.type.startsWith("image/")
    ) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      setImageSrc(event.target.result);
      setMarks(new Set());
      setReferenceOpen(true);
      setReferenceMinimized(false);

      setBoardOffset({
        x: 0,
        y: 0,
      });
    };

    reader.readAsDataURL(file);
  };

  const getCellFromClientPoint =
    useCallback(
      (clientX, clientY) => {
        const viewport =
          boardViewportRef.current;

        if (!viewport || !rows) {
          return null;
        }

        const rectangle =
          viewport.getBoundingClientRect();

        const boardX =
          clientX -
          rectangle.left -
          NUMBER_GUTTER -
          boardOffset.x;

        const boardY =
          clientY -
          rectangle.top -
          TOP_GUTTER -
          boardOffset.y;

        const column = Math.floor(
          boardX / zoom
        );

        const row = Math.floor(
          boardY / zoom
        );

        if (
          column < 0 ||
          column >= columns ||
          row < 0 ||
          row >= rows
        ) {
          return null;
        }

        return `${row}-${column}`;
      },
      [
        boardOffset.x,
        boardOffset.y,
        columns,
        rows,
        zoom,
      ]
    );

  const addMark = useCallback((key) => {
    if (!key) return;

    setMarks((previousMarks) => {
      if (previousMarks.has(key)) {
        return previousMarks;
      }

      const updatedMarks = new Set(
        previousMarks
      );

      updatedMarks.add(key);

      return updatedMarks;
    });
  }, []);

  const eraseMark = useCallback((key) => {
    if (!key) return;

    setMarks((previousMarks) => {
      if (!previousMarks.has(key)) {
        return previousMarks;
      }

      const updatedMarks = new Set(
        previousMarks
      );

      updatedMarks.delete(key);

      return updatedMarks;
    });
  }, []);
    const beginBoardPointer = (event) => {
    event.preventDefault();

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    );

    activePointersRef.current.set(
      event.pointerId,
      {
        x: event.clientX,
        y: event.clientY,
      }
    );

    const pointers = Array.from(
      activePointersRef.current.values()
    );

    if (pointers.length === 2) {
      const center = pointerCenter(
        pointers[0],
        pointers[1]
      );

      gestureRef.current = {
        type: "pinch",
        startDistance: Math.max(
          1,
          pointerDistance(
            pointers[0],
            pointers[1]
          )
        ),
        startZoom: zoom,
        startOffset: {
          ...boardOffset,
        },
        startCenter: center,
      };

      draggedMarkRef.current = null;
      dragPreviewRef.current = null;
      lastPaintedCellRef.current = null;
      suppressTapRef.current = true;

      return;
    }

    const key = getCellFromClientPoint(
      event.clientX,
      event.clientY
    );

    if (!key) return;

    lastPaintedCellRef.current = key;
    suppressTapRef.current = false;

    if (marks.has(key)) {
      draggedMarkRef.current = key;
      dragPreviewRef.current = key;

      gestureRef.current = {
        type: "move-mark",
        startX: event.clientX,
        startY: event.clientY,
      };

      return;
    }

    if (tool === "erase") {
      eraseMark(key);

      gestureRef.current = {
        type: "erase",
      };

      return;
    }

    addMark(key);

    gestureRef.current = {
      type: "paint",
    };
  };

  const moveBoardPointer = (event) => {
    if (
      !activePointersRef.current.has(
        event.pointerId
      )
    ) {
      return;
    }

    event.preventDefault();

    activePointersRef.current.set(
      event.pointerId,
      {
        x: event.clientX,
        y: event.clientY,
      }
    );

    const pointers = Array.from(
      activePointersRef.current.values()
    );

    if (pointers.length >= 2) {
      const first = pointers[0];
      const second = pointers[1];

      const currentCenter = pointerCenter(
        first,
        second
      );

      if (
        !gestureRef.current ||
        gestureRef.current.type !== "pinch"
      ) {
        gestureRef.current = {
          type: "pinch",
          startDistance: Math.max(
            1,
            pointerDistance(first, second)
          ),
          startZoom: zoom,
          startOffset: {
            ...boardOffset,
          },
          startCenter: currentCenter,
        };
      }

      const gesture = gestureRef.current;

      const nextZoom = clamp(
        Math.round(
          gesture.startZoom *
            (pointerDistance(
              first,
              second
            ) /
              gesture.startDistance)
        ),
        MIN_ZOOM,
        MAX_ZOOM
      );

      const zoomRatio =
        nextZoom / gesture.startZoom;

      const relativeX =
        gesture.startCenter.x -
        gesture.startOffset.x;

      const relativeY =
        gesture.startCenter.y -
        gesture.startOffset.y;

      setZoom(nextZoom);

      setBoardOffset({
        x:
          currentCenter.x -
          relativeX * zoomRatio,
        y:
          currentCenter.y -
          relativeY * zoomRatio,
      });

      suppressTapRef.current = true;

      return;
    }

    const gesture = gestureRef.current;

    if (!gesture) return;

    const movedDistance = Math.hypot(
      event.clientX -
        (gesture.startX ??
          event.clientX),
      event.clientY -
        (gesture.startY ??
          event.clientY)
    );

    if (gesture.type === "move-mark") {
      if (movedDistance > 4) {
        suppressTapRef.current = true;
      }

      const destinationKey =
        getCellFromClientPoint(
          event.clientX,
          event.clientY
        );

      if (destinationKey) {
        dragPreviewRef.current =
          destinationKey;
      }

      return;
    }

    const key = getCellFromClientPoint(
      event.clientX,
      event.clientY
    );

    if (
      !key ||
      key === lastPaintedCellRef.current
    ) {
      return;
    }

    lastPaintedCellRef.current = key;

    if (gesture.type === "paint") {
      addMark(key);
    }

    if (gesture.type === "erase") {
      eraseMark(key);
    }
  };

  const endBoardPointer = (event) => {
    activePointersRef.current.delete(
      event.pointerId
    );

    const gesture = gestureRef.current;

    if (
      gesture?.type === "move-mark" &&
      draggedMarkRef.current
    ) {
      const sourceKey =
        draggedMarkRef.current;

      const destinationKey =
        dragPreviewRef.current ||
        getCellFromClientPoint(
          event.clientX,
          event.clientY
        ) ||
        sourceKey;

      if (destinationKey !== sourceKey) {
        setMarks((previousMarks) => {
          const updatedMarks = new Set(
            previousMarks
          );

          updatedMarks.delete(sourceKey);
          updatedMarks.add(destinationKey);

          return updatedMarks;
        });
      }
    }

    if (
      activePointersRef.current.size === 0
    ) {
      gestureRef.current = null;
      draggedMarkRef.current = null;
      dragPreviewRef.current = null;
      lastPaintedCellRef.current = null;

      window.setTimeout(() => {
        suppressTapRef.current = false;
      }, 0);
    }
  };

  const startReferenceDrag = (event) => {
    if (
      event.target.closest("button")
    ) {
      return;
    }

    event.preventDefault();

    referenceDragRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    referenceStartRef.current = {
      ...referencePosition,
    };

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    );
  };

  const continueReferenceDrag = (
    event
  ) => {
    if (!referenceDragRef.current) {
      return;
    }

    const differenceX =
      event.clientX -
      referenceDragRef.current.x;

    const differenceY =
      event.clientY -
      referenceDragRef.current.y;

    setReferencePosition({
      x: Math.max(
        0,
        referenceStartRef.current.x +
          differenceX
      ),
      y: Math.max(
        0,
        referenceStartRef.current.y +
          differenceY
      ),
    });
  };

  const stopReferenceDrag = () => {
    referenceDragRef.current = null;
  };

  const downloadPattern = () => {
    const sourceCanvas =
      canvasRef.current;

    if (!sourceCanvas || !rows) {
      return;
    }

    const exportCanvas =
      document.createElement("canvas");

    const exportContext =
      exportCanvas.getContext("2d");

    exportCanvas.width =
      NUMBER_GUTTER +
      columns * zoom +
      2;

    exportCanvas.height =
      TOP_GUTTER +
      rows * zoom +
      2;

    exportContext.fillStyle =
      COLORS.white;

    exportContext.fillRect(
      0,
      0,
      exportCanvas.width,
      exportCanvas.height
    );

    exportContext.drawImage(
      sourceCanvas,
      NUMBER_GUTTER,
      TOP_GUTTER
    );

    exportContext.font = `${Math.max(
      9,
      Math.min(13, zoom * 0.55)
    )}px Arial`;

    exportContext.fillStyle =
      COLORS.charcoal;

    exportContext.textAlign = "center";
    exportContext.textBaseline =
      "middle";

    for (
      let column = 0;
      column < columns;
      column += 1
    ) {
      exportContext.fillText(
        String(column + 1),
        NUMBER_GUTTER +
          column * zoom +
          zoom / 2,
        TOP_GUTTER / 2
      );
    }

    for (
      let row = 0;
      row < rows;
      row += 1
    ) {
      exportContext.fillText(
        String(row + 1),
        NUMBER_GUTTER / 2,
        TOP_GUTTER +
          row * zoom +
          zoom / 2
      );
    }

    exportContext.strokeStyle =
      COLORS.border;

    exportContext.strokeRect(
      NUMBER_GUTTER,
      TOP_GUTTER,
      columns * zoom,
      rows * zoom
    );

    exportContext.fillStyle = xColor;

    exportContext.font = `bold ${Math.max(
      8,
      zoom * (xSize / 100)
    )}px Arial`;

    exportContext.textAlign = "center";
    exportContext.textBaseline =
      "middle";

    marks.forEach((key) => {
      const [row, column] = key
        .split("-")
        .map(Number);

      exportContext.fillText(
        "×",
        NUMBER_GUTTER +
          column * zoom +
          zoom / 2,
        TOP_GUTTER +
          row * zoom +
          zoom / 2 +
          1
      );
    });

    const link =
      document.createElement("a");

    link.download =
      "patron-mosaico-emuna.png";

    link.href =
      exportCanvas.toDataURL(
        "image/png"
      );

    link.click();
  };

  const resetImage = () => {
    setImageSrc("");
    setMarks(new Set());
    setProcessedGrid([]);
    setPalette([]);
    setRows(0);
    setReferenceOpen(false);

    setBoardOffset({
      x: 0,
      y: 0,
    });

    imageRef.current = null;

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const buttonStyle = (
    active = false,
    primary = false
  ) => ({
    border:
      active || primary
        ? "1px solid transparent"
        : `1px solid ${COLORS.border}`,
    background: active
      ? COLORS.charcoal
      : primary
        ? COLORS.lilac
        : COLORS.white,
    color: active
      ? COLORS.white
      : COLORS.charcoal,
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    touchAction: "manipulation",
  });

  const cardStyle = {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "14px",
    boxShadow:
      "0 3px 12px rgba(63, 63, 63, 0.06)",
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
          fontFamily:
            "Arial, sans-serif",
          padding: "22px 14px 50px",
        }}
      >
        <div
          style={{
            maxWidth: "1050px",
            margin: "0 auto",
          }}
        >
          <header
            style={{
              marginBottom: "22px",
            }}
          >
            <h1
              style={{
                fontFamily:
                  "Georgia, serif",
                fontSize:
                  "clamp(30px, 6vw, 48px)",
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
              Marcá manualmente cada X.
              Con un dedo o lápiz podés
              crear y mover marcas; con dos
              dedos podés ampliar, reducir y
              desplazar el patrón.
            </p>
          </header>

          <section style={cardStyle}>
            <div
              style={{
                fontFamily:
                  "Georgia, serif",
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
                onClick={() =>
                  setMode("common")
                }
                style={{
                  ...buttonStyle(
                    mode === "common"
                  ),
                  padding: "16px",
                  textAlign: "left",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Imagen común
                </strong>

                <span
                  style={{
                    display: "block",
                    fontWeight: "400",
                    lineHeight: 1.5,
                  }}
                >
                  Emuná convierte la imagen
                  en una cuadrícula y reduce
                  la cantidad de colores.
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setMode("pixelated")
                }
                style={{
                  ...buttonStyle(
                    mode === "pixelated"
                  ),
                  padding: "16px",
                  textAlign: "left",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Patrón ya pixelado
                </strong>

                <span
                  style={{
                    display: "block",
                    fontWeight: "400",
                    lineHeight: 1.5,
                  }}
                >
                  Conserva la imagen y coloca
                  la cuadrícula y las X por
                  encima.
                </span>
              </button>
            </div>
          </section>

          {!imageSrc ? (
            <section
              onClick={() =>
                fileRef.current?.click()
              }
              onDragOver={(event) =>
                event.preventDefault()
              }
              onDrop={(event) => {
                event.preventDefault();

                uploadImage(
                  event.dataTransfer.files?.[0]
                );
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
                  justifyContent:
                    "center",
                  fontSize: "32px",
                  marginBottom: "14px",
                }}
              >
                +
              </div>

              <div
                style={{
                  fontFamily:
                    "Georgia, serif",
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
                Tocá aquí para elegirla
                desde tu galería.
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) =>
                  uploadImage(
                    event.target.files?.[0]
                  )
                }
              />
            </section>
          ) : (
            <>
                          <section
                style={{
                  ...cardStyle,
                  position: "fixed",
                  top: "10px",
                  right: "10px",
                  zIndex: 1400,
                  width: controlsMinimized
                    ? "210px"
                    : "min(430px, calc(100vw - 20px))",
                  maxHeight:
                    controlsMinimized
                      ? "52px"
                      : "46vh",
                  overflow: "hidden",
                  padding:
                    controlsMinimized
                      ? "8px 10px"
                      : "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    gap: "8px",
                    marginBottom:
                      controlsMinimized
                        ? 0
                        : "12px",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "13px",
                    }}
                  >
                    Herramientas
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      setControlsMinimized(
                        (value) => !value
                      )
                    }
                    style={{
                      ...buttonStyle(),
                      width: "34px",
                      height: "34px",
                      padding: 0,
                    }}
                  >
                    {controlsMinimized
                      ? "+"
                      : "−"}
                  </button>
                </div>

                {!controlsMinimized && (
                  <div
                    style={{
                      maxHeight:
                        "calc(46vh - 58px)",
                      overflowY: "auto",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(130px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <label
                          style={labelStyle}
                        >
                          Columnas: {columns}
                        </label>

                        <input
                          type="range"
                          min="8"
                          max="100"
                          value={columns}
                          onChange={(event) =>
                            setColumns(
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                          style={{
                            width: "100%",
                            accentColor:
                              COLORS.lilac,
                          }}
                        />
                      </div>

                      {mode === "common" && (
                        <div>
                          <label
                            style={labelStyle}
                          >
                            Colores:{" "}
                            {numberOfColors}
                          </label>

                          <input
                            type="range"
                            min="2"
                            max="12"
                            value={
                              numberOfColors
                            }
                            onChange={(
                              event
                            ) =>
                              setNumberOfColors(
                                Number(
                                  event.target
                                    .value
                                )
                              )
                            }
                            style={{
                              width: "100%",
                              accentColor:
                                COLORS.mint,
                            }}
                          />
                        </div>
                      )}

                      <div>
                        <label
                          style={labelStyle}
                        >
                          Zoom: {zoom}
                        </label>

                        <input
                          type="range"
                          min={MIN_ZOOM}
                          max={MAX_ZOOM}
                          value={zoom}
                          onChange={(event) =>
                            setZoom(
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                          style={{
                            width: "100%",
                            accentColor:
                              COLORS.pink,
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={labelStyle}
                        >
                          Tamaño de la X:{" "}
                          {xSize}%
                        </label>

                        <input
                          type="range"
                          min="35"
                          max="95"
                          value={xSize}
                          onChange={(event) =>
                            setXSize(
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                          style={{
                            width: "100%",
                            accentColor:
                              COLORS.charcoal,
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={labelStyle}
                        >
                          Color de la X
                        </label>

                        <input
                          type="color"
                          value={xColor}
                          onChange={(event) =>
                            setXColor(
                              event.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            height: "38px",
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "9px",
                            background:
                              COLORS.white,
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginTop: "14px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setTool("mark")
                        }
                        style={buttonStyle(
                          tool === "mark"
                        )}
                      >
                        Marcar X
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setTool("erase")
                        }
                        style={buttonStyle(
                          tool === "erase"
                        )}
                      >
                        Borrar X
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setShowGrid(
                            (value) => !value
                          )
                        }
                        style={buttonStyle(
                          showGrid
                        )}
                      >
                        {showGrid
                          ? "Ocultar cuadrícula"
                          : "Mostrar cuadrícula"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setMarks(new Set())
                        }
                        style={buttonStyle()}
                      >
                        Borrar todas
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setReferenceOpen(
                            (value) => !value
                          )
                        }
                        style={buttonStyle(
                          referenceOpen
                        )}
                      >
                        Referencia flotante
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
                        onClick={
                          downloadPattern
                        }
                        style={buttonStyle(
                          false,
                          true
                        )}
                      >
                        Descargar patrón
                      </button>
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        padding: "9px 10px",
                        borderRadius: "10px",
                        background:
                          tool === "erase"
                            ? COLORS.pink
                            : COLORS.mint,
                        fontSize: "12px",
                        lineHeight: 1.45,
                      }}
                    >
                      {tool === "erase"
                        ? "Tocá o arrastrá sobre una X para borrarla."
                        : "Tocá una celda vacía para crear una X. Arrastrá una X existente para moverla. Usá dos dedos para ampliar, achicar o desplazar el patrón."}

                      <strong
                        style={{
                          marginLeft: "7px",
                        }}
                      >
                        {marks.size}{" "}
                        {marks.size === 1
                          ? "marca"
                          : "marcas"}
                      </strong>
                    </div>
                  </div>
                )}
              </section>

              <div
                style={{
                  height: controlsMinimized
                    ? "65px"
                    : "205px",
                }}
              />

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
                  ref={boardViewportRef}
                  onPointerDown={
                    beginBoardPointer
                  }
                  onPointerMove={
                    moveBoardPointer
                  }
                  onPointerUp={
                    endBoardPointer
                  }
                  onPointerCancel={
                    endBoardPointer
                  }
                  onContextMenu={(event) =>
                    event.preventDefault()
                  }
                  style={{
                    ...cardStyle,
                    position: "relative",
                    height: "72vh",
                    overflow: "hidden",
                    padding: 0,
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect:
                      "none",
                    WebkitTouchCallout:
                      "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: `${boardOffset.x}px`,
                      top: `${boardOffset.y}px`,
                      display: "grid",
                      gridTemplateColumns: `${NUMBER_GUTTER}px ${
                        columns * zoom
                      }px`,
                      gridTemplateRows: `${TOP_GUTTER}px ${
                        rows * zoom
                      }px`,
                      width:
                        NUMBER_GUTTER +
                        columns * zoom,
                      height:
                        TOP_GUTTER +
                        rows * zoom,
                    }}
                  >
                    <div
                      style={{
                        gridColumn: 1,
                        gridRow: 1,
                        background:
                          COLORS.white,
                        borderRight: `1px solid ${COLORS.border}`,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    />

                    <div
                      style={{
                        gridColumn: 2,
                        gridRow: 1,
                        display: "grid",
                        gridTemplateColumns: `repeat(${columns}, ${zoom}px)`,
                        height: `${TOP_GUTTER}px`,
                        background:
                          COLORS.white,
                      }}
                    >
                      {Array.from({
                        length: columns,
                      }).map(
                        (_, column) => (
                          <div
                            key={`column-${column}`}
                            style={{
                              width: `${zoom}px`,
                              height: `${TOP_GUTTER}px`,
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              fontSize: `${Math.max(
                                8,
                                Math.min(
                                  12,
                                  zoom * 0.5
                                )
                              )}px`,
                              color:
                                COLORS.muted,
                              borderRight: `1px solid ${COLORS.border}`,
                              boxSizing:
                                "border-box",
                              userSelect:
                                "none",
                            }}
                          >
                            {column + 1}
                          </div>
                        )
                      )}
                    </div>

                    <div
                      style={{
                        gridColumn: 1,
                        gridRow: 2,
                        display: "grid",
                        gridTemplateRows: `repeat(${rows}, ${zoom}px)`,
                        width: `${NUMBER_GUTTER}px`,
                        background:
                          COLORS.white,
                      }}
                    >
                      {Array.from({
                        length: rows,
                      }).map((_, row) => (
                        <div
                          key={`row-${row}`}
                          style={{
                            width: `${NUMBER_GUTTER}px`,
                            height: `${zoom}px`,
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontSize: `${Math.max(
                              8,
                              Math.min(
                                12,
                                zoom * 0.5
                              )
                            )}px`,
                            color:
                              COLORS.muted,
                            borderBottom: `1px solid ${COLORS.border}`,
                            borderRight: `1px solid ${COLORS.border}`,
                            boxSizing:
                              "border-box",
                            userSelect:
                              "none",
                          }}
                        >
                          {row + 1}
                        </div>
                      ))}
                    <div
                      style={{
                        gridColumn: 2,
                        gridRow: 2,
                        position: "relative",
                        width: `${
                          columns * zoom
                        }px`,
                        height: `${
                          rows * zoom
                        }px`,
                      }}
                    >
                      <canvas
                        ref={canvasRef}
                        style={{
                          position:
                            "absolute",
                          inset: 0,
                          display: "block",
                          width: `${
                            columns * zoom
                          }px`,
                          height: `${
                            rows * zoom
                          }px`,
                          imageRendering:
                            "pixelated",
                          pointerEvents:
                            "none",
                        }}
                      />

                      <div
                        style={{
                          position:
                            "absolute",
                          inset: 0,
                          display: "grid",
                          gridTemplateColumns: `repeat(${columns}, ${zoom}px)`,
                          gridTemplateRows: `repeat(${rows}, ${zoom}px)`,
                          width: `${
                            columns * zoom
                          }px`,
                          height: `${
                            rows * zoom
                          }px`,
                          pointerEvents:
                            "none",
                        }}
                      >
                        {Array.from({
                          length: rows,
                        }).map((_, row) =>
                          Array.from({
                            length: columns,
                          }).map(
                            (_, column) => {
                              const key = `${row}-${column}`;

                              const marked =
                                marks.has(key);

                              return (
                                <div
                                  key={key}
                                  style={{
                                    width: `${zoom}px`,
                                    height: `${zoom}px`,
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    color:
                                      xColor,
                                    fontSize: `${Math.max(
                                      7,
                                      zoom *
                                        (xSize /
                                          100)
                                    )}px`,
                                    fontWeight:
                                      "700",
                                    lineHeight: 1,
                                    fontFamily:
                                      "Arial, sans-serif",
                                    userSelect:
                                      "none",
                                  }}
                                >
                                  {marked
                                    ? "×"
                                    : ""}
                                </div>
                              );
                            }
                          )
                        )}
                      </div>
                    </div>
                  </div>
             </section>
              )}
            </>
          )}

          <canvas
            ref={processingCanvasRef}
            hidden
          />
        </div>

        {imageSrc && referenceOpen && (
          <aside
            onPointerDown={
              startReferenceDrag
            }
            onPointerMove={
              continueReferenceDrag
            }
            onPointerUp={
              stopReferenceDrag
            }
            onPointerCancel={
              stopReferenceDrag
            }
            style={{
              position: "fixed",
              left: `${referencePosition.x}px`,
              top: `${referencePosition.y}px`,
              zIndex: 1300,
              width: referenceMinimized
                ? "190px"
                : "min(310px, calc(100vw - 36px))",
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "14px",
              boxShadow:
                "0 8px 28px rgba(63, 63, 63, 0.22)",
              overflow: "hidden",
              touchAction: "none",
              userSelect: "none",
            }}
          >
            <div
              style={{
                height: "42px",
                padding:
                  "0 8px 0 12px",
                background:
                  COLORS.charcoal,
                color: COLORS.white,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                cursor: "move",
              }}
            >
              <strong
                style={{
                  fontSize: "13px",
                }}
              >
                Imagen de referencia
              </strong>

              <div
                style={{
                  display: "flex",
                  gap: "5px",
                }}
              >
                <button
                  type="button"
                  onPointerDown={(event) =>
                    event.stopPropagation()
                  }
                  onClick={() =>
                    setReferenceMinimized(
                      (value) => !value
                    )
                  }
                  style={{
                    width: "30px",
                    height: "30px",
                    padding: 0,
                    border: "none",
                    borderRadius: "8px",
                    background:
                      "rgba(255,255,255,0.16)",
                    color: COLORS.white,
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  {referenceMinimized
                    ? "+"
                    : "−"}
                </button>

                <button
                  type="button"
                  onPointerDown={(event) =>
                    event.stopPropagation()
                  }
                  onClick={() =>
                    setReferenceOpen(false)
                  }
                  style={{
                    width: "30px",
                    height: "30px",
                    padding: 0,
                    border: "none",
                    borderRadius: "8px",
                    background:
                      "rgba(255,255,255,0.16)",
                    color: COLORS.white,
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {!referenceMinimized && (
              <div
                style={{
                  padding: "8px",
                  background:
                    COLORS.cream,
                }}
              >
                <img
                  src={imageSrc}
                  alt="Referencia del patrón"
                  draggable={false}
                  onDragStart={(event) =>
                    event.preventDefault()
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    maxHeight: "360px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    background:
                      COLORS.white,
                    pointerEvents:
                      "none",
                  }}
                />
              </div>
            )}
          </aside>
        )}
      </main>
    </AuthGuard>
  );
}                           
                    
