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
  softLilac: "#F2EBF8",
  softMint: "#EAF7F3",
  softPink: "#FDEBE8",
};

const colorDistance = (first, second) =>
  Math.sqrt(
    (first.r - second.r) ** 2 +
      (first.g - second.g) ** 2 +
      (first.b - second.b) ** 2
  );

function kMeans(pixels, amount) {
  if (!pixels.length) return [];

  const safeAmount = Math.min(amount, pixels.length);
  const step = Math.max(1, Math.floor(pixels.length / safeAmount));

  let centers = Array.from({ length: safeAmount }, (_, index) => ({
    ...pixels[Math.min(index * step, pixels.length - 1)],
  }));

  for (let iteration = 0; iteration < 18; iteration += 1) {
    const totals = Array.from({ length: safeAmount }, () => ({
      r: 0,
      g: 0,
      b: 0,
      count: 0,
    }));

    pixels.forEach((pixel) => {
      let closestIndex = 0;
      let closestDistance = Infinity;

      centers.forEach((center, index) => {
        const currentDistance = colorDistance(pixel, center);

        if (currentDistance < closestDistance) {
          closestDistance = currentDistance;
          closestIndex = index;
        }
      });

      totals[closestIndex].r += pixel.r;
      totals[closestIndex].g += pixel.g;
      totals[closestIndex].b += pixel.b;
      totals[closestIndex].count += 1;
    });

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

function findNearestColor(pixel, centers) {
  let closestIndex = 0;
  let closestDistance = Infinity;

  centers.forEach((center, index) => {
    const currentDistance = colorDistance(pixel, center);

    if (currentDistance < closestDistance) {
      closestDistance = currentDistance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

export default function PatronesMosaicos() {
  const [imageMode, setImageMode] = useState("pixelated");
  const [imageSrc, setImageSrc] = useState("");

  const [columns, setColumns] = useState(40);
  const [rows, setRows] = useState(0);
  const [numberOfColors, setNumberOfColors] = useState(5);
  const [zoom, setZoom] = useState(18);

  const [xSize, setXSize] = useState(70);
  const [xColor, setXColor] = useState(COLORS.charcoal);
  const [showGrid, setShowGrid] = useState(true);

  const [tool, setTool] = useState("move");
  const [marks, setMarks] = useState(new Set());

  const [processedGrid, setProcessedGrid] = useState([]);
  const [palette, setPalette] = useState([]);
  const [processing, setProcessing] = useState(false);

  const fileRef = useRef(null);
  const canvasRef = useRef(null);
  const processingCanvasRef = useRef(null);
  const imageRef = useRef(null);

  const pointerStartRef = useRef(null);

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

      if (imageMode === "pixelated") {
        setProcessedGrid([]);
        setPalette([]);
        setProcessing(false);
        return;
      }

      setProcessing(true);

      const hiddenCanvas = processingCanvasRef.current;

      if (!hiddenCanvas) {
        setProcessing(false);
        return;
      }

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
        pixels.map((pixel) => findNearestColor(pixel, centers))
      );

      setProcessing(false);
    };

    image.onerror = () => {
      setProcessing(false);
    };

    image.src = imageSrc;
  }, [
    imageSrc,
    imageMode,
    columns,
    numberOfColors,
    calculateRows,
  ]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  useEffect(() => {
    setMarks(new Set());
  }, [imageSrc, columns, imageMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !imageSrc || !rows || !image) return;

    canvas.width = columns * zoom;
    canvas.height = rows * zoom;

    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (imageMode === "common" && processedGrid.length) {
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
      context.strokeStyle = "rgba(63, 63, 63, 0.32)";
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

    const padding = (zoom * (1 - xSize / 100)) / 2;

    context.strokeStyle = xColor;
    context.lineWidth = Math.max(1.5, zoom * 0.13);
    context.lineCap = "round";

    marks.forEach((key) => {
      const [row, column] = key.split("-").map(Number);

      const x = column * zoom + padding;
      const y = row * zoom + padding;
      const size = zoom - padding * 2;

      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + size, y + size);
      context.stroke();

      context.beginPath();
      context.moveTo(x + size, y);
      context.lineTo(x, y + size);
      context.stroke();
    });
  }, [
    imageSrc,
    rows,
    columns,
    zoom,
    imageMode,
    processedGrid,
    palette,
    showGrid,
    marks,
    xColor,
    xSize,
  ]);

  const uploadImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      setImageSrc(event.target.result);
      setMarks(new Set());
      setTool("move");
    };

    reader.readAsDataURL(file);
  };

  const getCellFromPoint = (clientX, clientY) => {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    const rectangle = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rectangle.width;
    const scaleY = canvas.height / rectangle.height;

    const x = (clientX - rectangle.left) * scaleX;
    const y = (clientY - rectangle.top) * scaleY;

    const column = Math.floor(x / zoom);
    const row = Math.floor(y / zoom);

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

  const handlePointerDown = (event) => {
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
  };

  const handlePointerUp = (event) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;

    if (!start || tool === "move") return;
    if (start.pointerId !== event.pointerId) return;

    const movedX = Math.abs(event.clientX - start.x);
    const movedY = Math.abs(event.clientY - start.y);

    const isTap = movedX < 10 && movedY < 10;

    if (!isTap) return;

    const cell = getCellFromPoint(event.clientX, event.clientY);

    if (!cell) return;

    setMarks((previousMarks) => {
      const updatedMarks = new Set(previousMarks);

      if (tool === "mark") {
        updatedMarks.add(cell);
      }

      if (tool === "erase") {
        updatedMarks.delete(cell);
      }

      return updatedMarks;
    });
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
    setTool("move");

    imageRef.current = null;

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const buttonStyle = ({
    active = false,
    background = COLORS.white,
    color = COLORS.charcoal,
  } = {}) => ({
    border: active
      ? `2px solid ${COLORS.charcoal}`
      : `1px solid ${COLORS.border}`,
    background: active ? COLORS.charcoal : background,
    color: active ? COLORS.white : color,
    borderRadius: "11px",
    padding: "11px 15px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  });

  const cardStyle = {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "18px",
    padding: "17px",
    marginBottom: "15px",
    boxShadow: "0 4px 14px rgba(63, 63, 63, 0.07)",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    color: COLORS.muted,
    marginBottom: "7px",
  };

  return (
    <AuthGuard>
      <main
        style={{
          minHeight: "100vh",
          background: COLORS.cream,
          color: COLORS.charcoal,
          fontFamily: "Arial, sans-serif",
          paddingBottom: "55px",
        }}
      >
        <header
          style={{
            background: COLORS.charcoal,
            color: COLORS.white,
            padding: "26px 16px",
            borderBottom: `8px solid ${COLORS.lilac}`,
          }}
        >
          <div
            style={{
              maxWidth: "1050px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: COLORS.mint,
                color: COLORS.charcoal,
                borderRadius: "30px",
                padding: "5px 11px",
                fontSize: "11px",
                fontWeight: "700",
                marginBottom: "11px",
              }}
            >
              EMUNÁ STUDIO
            </div>

            <h1
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(31px, 7vw, 50px)",
                margin: "0 0 9px",
              }}
            >
              Patrones Mosaicos
            </h1>

            <p
              style={{
                maxWidth: "680px",
                margin: 0,
                fontSize: "14px",
                lineHeight: 1.65,
                opacity: 0.88,
              }}
            >
              Convertí una imagen o trabajá sobre un patrón ya
              pixelado y marcá una X exactamente donde corresponda.
            </p>
          </div>
        </header>

        <div
          style={{
            maxWidth: "1050px",
            margin: "0 auto",
            padding: "20px 14px",
          }}
        >
          <section style={cardStyle}>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "21px",
                fontWeight: "700",
                marginBottom: "7px",
              }}
            >
              ¿Cómo querés comenzar?
            </div>

            <p
              style={{
                margin: "0 0 15px",
                color: COLORS.muted,
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              Elegí la opción que corresponda a la imagen que vas a
              subir.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => setImageMode("common")}
                style={{
                  border:
                    imageMode === "common"
                     
