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

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const getDistance = (a, b) =>
  Math.hypot(b.x - a.x, b.y - a.y);

const getCenter = (a, b) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

export default function PatronesMosaicos() {
  const [imageSrc, setImageSrc] = useState("");
  const [columns, setColumns] = useState(40);
  const [rows, setRows] = useState(0);
  const [zoom, setZoom] = useState(18);
  const [xSize, setXSize] = useState(62);
  const [xColor, setXColor] = useState("#3F3F3F");
  const [showGrid, setShowGrid] = useState(true);
  const [tool, setTool] = useState("mark");
  const [marks, setMarks] = useState([]);

  const [boardOffset, setBoardOffset] = useState({
    x: 0,
    y: 0,
  });

  const [controlsMinimized, setControlsMinimized] =
    useState(false);

  const [referenceOpen, setReferenceOpen] =
    useState(true);

  const [referenceMinimized, setReferenceMinimized] =
    useState(false);

  const [referencePosition, setReferencePosition] =
    useState({
      x: 18,
      y: 90,
    });

  const fileRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const boardRef = useRef(null);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef(null);
  const referenceDragRef = useRef(null);
  const nextMarkIdRef = useRef(1);

  const cardStyle = {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "14px",
    boxShadow:
      "0 3px 12px rgba(63, 63, 63, 0.06)",
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
    padding: "10px 13px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    touchAction: "manipulation",
  });

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: COLORS.muted,
    marginBottom: "6px",
  };

  const uploadImage = (file) => {
    if (
      !file ||
      !file.type.startsWith("image/")
    ) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const src = event.target?.result;

      if (typeof src !== "string") {
        return;
      }

      const image = new Image();

      image.onload = () => {
        imageRef.current = image;

        setRows(
          Math.max(
            5,
            Math.round(
              columns *
                (image.height / image.width)
            )
          )
        );

        setImageSrc(src);
        setMarks([]);

        setBoardOffset({
          x: 0,
          y: 0,
        });

        setReferenceOpen(true);
        setReferenceMinimized(false);
      };

      image.src = src;
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const image = imageRef.current;

    if (!image) {
      return;
    }

    setRows(
      Math.max(
        5,
        Math.round(
          columns *
            (image.height / image.width)
        )
      )
    );



    setBoardOffset({
      x: 0,
      y: 0,
    });
  }, [columns]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image || !rows) {
      return;
    }

    canvas.width = columns * zoom;
    canvas.height = rows * zoom;

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    context.imageSmoothingEnabled = false;

    context.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (showGrid) {
      context.strokeStyle =
        "rgba(63, 63, 63, 0.35)";

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
    columns,
    rows,
    zoom,
    showGrid,
    imageSrc,
  ]);

  const getBoardPoint = useCallback(
  (clientX, clientY) => {
    const board = boardRef.current;

    if (!board || !rows) {
      return null;
    }

    const rect =
      board.getBoundingClientRect();

    const rawX =
      (clientX - rect.left) / zoom;

    const rawY =
      (clientY - rect.top) / zoom;

    if (
      rawX < 0 ||
      rawX >= columns ||
      rawY < 0 ||
      rawY >= rows
    ) {
      return null;
    }

    const column = Math.floor(rawX);
    const row = Math.floor(rawY);

    const margin = clamp(
      xSize / 300,
      0.12,
      0.32
    );

    const positionInsideColumn =
      clamp(
        rawX - column,
        margin,
        1 - margin
      );

    const positionInsideRow =
      clamp(
        rawY - row,
        margin,
        1 - margin
      );

    return {
      x:
        column +
        positionInsideColumn,
      y:
        row +
        positionInsideRow,
    };
  },
  [columns, rows, zoom, xSize]
);

  const addFreeMark = useCallback(
    (point) => {
      if (!point) {
        return;
      }

      setMarks((previous) => [
        ...previous,
        {
          id: nextMarkIdRef.current++,
          x: point.x,
          y: point.y,
        },
      ]);
    },
    []
  );

  const removeMarkById = useCallback(
    (id) => {
      setMarks((previous) =>
        previous.filter(
          (mark) => mark.id !== id
        )
      );
    },
    []
  );

  const startPinch = (pointers) => {
    const first = pointers[0];
    const second = pointers[1];

    gestureRef.current = {
      type: "pinch",
      startDistance: Math.max(
        1,
        getDistance(first, second)
      ),
      startCenter: getCenter(
        first,
        second
      ),
      startZoom: zoom,
      startOffset: {
        ...boardOffset,
      },
    };
  };

  const handleBoardPointerDown = (
    event
  ) => {
    event.preventDefault();

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    );

    pointersRef.current.set(
      event.pointerId,
      {
        x: event.clientX,
        y: event.clientY,
      }
    );

    const pointers = [
      ...pointersRef.current.values(),
    ];

    if (pointers.length === 2) {
      startPinch(pointers);
      return;
    }

    if (tool !== "mark") {
      gestureRef.current = null;
      return;
    }

    gestureRef.current = {
      type: "pending-mark",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      point: getBoardPoint(
        event.clientX,
        event.clientY
      ),
      moved: false,
    };
  };

  const handleBoardPointerMove = (
    event
  ) => {
    if (
      !pointersRef.current.has(
        event.pointerId
      )
    ) {
      return;
    }

    event.preventDefault();

    pointersRef.current.set(
      event.pointerId,
      {
        x: event.clientX,
        y: event.clientY,
      }
    );

    const pointers = [
      ...pointersRef.current.values(),
    ];

    if (pointers.length >= 2) {
      if (
        !gestureRef.current ||
        gestureRef.current.type !==
          "pinch"
      ) {
        startPinch(pointers);
      }

      const gesture =
        gestureRef.current;

      const first = pointers[0];
      const second = pointers[1];

      const currentCenter = getCenter(
        first,
        second
      );

      const nextZoom = clamp(
        Math.round(
          gesture.startZoom *
            (getDistance(
              first,
              second
            ) /
              gesture.startDistance)
        ),
        MIN_ZOOM,
        MAX_ZOOM
      );

      const ratio =
        nextZoom / gesture.startZoom;

      setZoom(nextZoom);

      setBoardOffset({
        x:
          currentCenter.x -
          (gesture.startCenter.x -
            gesture.startOffset.x) *
            ratio,
        y:
          currentCenter.y -
          (gesture.startCenter.y -
            gesture.startOffset.y) *
            ratio,
      });

      return;
    }

    const gesture =
      gestureRef.current;

    if (
      gesture?.type ===
        "pending-mark" &&
      gesture.pointerId ===
        event.pointerId
    ) {
      const movementDistance =
        Math.hypot(
          event.clientX -
            gesture.startX,
          event.clientY -
            gesture.startY
        );

      if (movementDistance > 8) {
        gesture.moved = true;
      }
    }
  };

  const handleBoardPointerEnd = (
    event
  ) => {
    const gesture =
      gestureRef.current;

    if (
      gesture?.type ===
        "pending-mark" &&
      gesture.pointerId ===
        event.pointerId &&
      !gesture.moved &&
      pointersRef.current.size === 1
    ) {
      addFreeMark(
        gesture.point
      );
    }

    pointersRef.current.delete(
      event.pointerId
    );

    if (
      pointersRef.current.size === 0
    ) {
      gestureRef.current = null;
    }
  };

  const startReferenceDrag = (
    event
  ) => {
    if (
      event.target.closest("button")
    ) {
      return;
    }

    event.preventDefault();

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    );

    referenceDragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: referencePosition.x,
      startY: referencePosition.y,
    };
  };

  const moveReference = (event) => {
    const drag =
      referenceDragRef.current;

    if (!drag) {
      return;
    }

    setReferencePosition({
      x: Math.max(
        0,
        drag.startX +
          event.clientX -
          drag.pointerX
      ),
      y: Math.max(
        0,
        drag.startY +
          event.clientY -
          drag.pointerY
      ),
    });
  };

  const stopReferenceDrag = () => {
    referenceDragRef.current = null;
  };

  const resetImage = () => {
    setImageSrc("");
    setRows(0);
    setMarks([]);

    setBoardOffset({
      x: 0,
      y: 0,
    });

    setReferenceOpen(false);
    imageRef.current = null;

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const downloadPattern = () => {
    const source =
      canvasRef.current;

    if (!source || !rows) {
      return;
    }

    const exportCanvas =
      document.createElement("canvas");

    const context =
      exportCanvas.getContext("2d");

    if (!context) {
      return;
    }

    exportCanvas.width =
      NUMBER_GUTTER +
      columns * zoom +
      2;

    exportCanvas.height =
      TOP_GUTTER +
      rows * zoom +
      2;

    context.fillStyle =
      COLORS.white;

    context.fillRect(
      0,
      0,
      exportCanvas.width,
      exportCanvas.height
    );

    context.drawImage(
      source,
      NUMBER_GUTTER,
      TOP_GUTTER
    );

    context.fillStyle =
      COLORS.charcoal;

    context.textAlign = "center";
    context.textBaseline =
      "middle";

    context.font = `${Math.max(
      8,
      Math.min(12, zoom * 0.5)
    )}px Arial`;

    for (
      let column = 0;
      column < columns;
      column += 1
    ) {
      context.fillText(
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
      context.fillText(
        String(row + 1),
        NUMBER_GUTTER / 2,
        TOP_GUTTER +
          row * zoom +
          zoom / 2
      );
    }

    context.fillStyle = xColor;

    context.font = `bold ${Math.max(
      7,
      zoom * (xSize / 100)
    )}px Arial`;

    marks.forEach((mark) => {
      context.fillText(
        "×",
        NUMBER_GUTTER +
          mark.x * zoom,
        TOP_GUTTER +
          mark.y * zoom
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
              marginBottom: "20px",
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
                lineHeight: 1.55,
              }}
            >
              Tocá cualquier punto para
              colocar una X exactamente
              allí. Usá dos dedos para
              ampliar o desplazar el
              tablero.
            </p>
          </header>

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
                  event.dataTransfer
                    .files?.[0]
                );
              }}
              style={{
                ...cardStyle,
                minHeight: "260px",
                border: `2px dashed ${COLORS.lilac}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent:
                  "center",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background:
                    COLORS.lilac,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 32,
                  marginBottom: 14,
                }}
              >
                +
              </div>

              <strong
                style={{
                  fontFamily:
                    "Georgia, serif",
                  fontSize: 21,
                  marginBottom: 7,
                }}
              >
                Subí tu patrón ya pixelado
              </strong>

              <span
                style={{
                  color: COLORS.muted,
                  fontSize: 14,
                }}
              >
                Tocá aquí para elegirlo
                desde tu galería.
              </span>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) =>
                  uploadImage(
                    event.target
                      .files?.[0]
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
                  width:
                    controlsMinimized
                      ? "210px"
                      : "min(430px, calc(100vw - 20px))",
                  maxHeight:
                    controlsMinimized
                      ? "52px"
                      : "48vh",
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
                    marginBottom:
                      controlsMinimized
                        ? 0
                        : 12,
                  }}
                >
                  <strong
                    style={{
                      fontSize: 13,
                    }}
                  >
                    Herramientas
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      setControlsMinimized(
                        (value) =>
                          !value
                      )
                    }
                    style={{
                      ...buttonStyle(),
                      width: 34,
                      height: 34,
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
                        "calc(48vh - 58px)",
                      overflowY:
                        "auto",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div>
                        <label
                          style={labelStyle}
                        >
                          Columnas:{" "}
                          {columns}
                        </label>

                        <input
                          type="range"
                          min="8"
                          max="100"
                          value={columns}
                          onChange={(
                            event
                          ) =>
                            setColumns(
                              Number(
                                event
                                  .target
                                  .value
                              )
                            )
                          }
                          style={{
                            width:
                              "100%",
                            accentColor:
                              COLORS.lilac,
                          }}
                        />
                      </div>

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
                          onChange={(
                            event
                          ) =>
                            setZoom(
                              Number(
                                event
                                  .target
                                  .value
                              )
                            )
                          }
                          style={{
                            width:
                              "100%",
                            accentColor:
                              COLORS.pink,
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={labelStyle}
                        >
                          Tamaño X:{" "}
                          {xSize}%
                        </label>

                        <input
                          type="range"
                          min="35"
                          max="95"
                          value={xSize}
                          onChange={(
                            event
                          ) =>
                            setXSize(
                              Number(
                                event
                                  .target
                                  .value
                              )
                            )
                          }
                          style={{
                            width:
                              "100%",
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
                          onChange={(
                            event
                          ) =>
                            setXColor(
                              event
                                .target
                                .value
                            )
                          }
                          style={{
                            width:
                              "100%",
                            height: 38,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 9,
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
                        gap: 8,
                        marginTop: 14,
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
                            (value) =>
                              !value
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
                          setMarks([])
                        }
                        style={buttonStyle()}
                      >
                        Borrar todas
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setReferenceOpen(
                            (value) =>
                              !value
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
                        marginTop: 12,
                        padding:
                          "9px 10px",
                        borderRadius: 10,
                        background:
                          tool ===
                          "erase"
                            ? COLORS.pink
                            : COLORS.mint,
                        fontSize: 12,
                        lineHeight: 1.45,
                      }}
                    >
                      {tool === "erase"
                        ? "Tocá directamente la X que querés borrar."
                        : "Tocá cualquier punto para colocar una X exactamente allí. Dos dedos amplían y desplazan."}

                      <strong
                        style={{
                          marginLeft: 7,
                        }}
                      >
                        {marks.length}{" "}
                        {marks.length === 1
                          ? "marca"
                          : "marcas"}
                      </strong>
                    </div>
                  </div>
                )}
              </section>

              <div
                style={{
                  height:
                    controlsMinimized
                      ? 60
                      : 190,
                               }}
              />

              <section
                onPointerDown={
                  handleBoardPointerDown
                }
                onPointerMove={
                  handleBoardPointerMove
                }
                onPointerUp={
                  handleBoardPointerEnd
                }
                onPointerCancel={
                  handleBoardPointerEnd
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
                  WebkitUserSelect: "none",
                  WebkitTouchCallout: "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: boardOffset.x,
                    top: boardOffset.y,
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
                      background: COLORS.white,
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
                      background: COLORS.white,
                    }}
                  >
                    {Array.from({
                      length: columns,
                    }).map((_, column) => (
                      <div
                        key={`column-${column}`}
                        style={{
                          width: zoom,
                          height: TOP_GUTTER,
                          display: "grid",
                          placeItems: "center",
                          fontSize: Math.max(
                            8,
                            Math.min(
                              12,
                              zoom * 0.5
                            )
                          ),
                          color: COLORS.muted,
                          borderRight: `1px solid ${COLORS.border}`,
                          boxSizing: "border-box",
                        }}
                      >
                        {column + 1}
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      gridColumn: 1,
                      gridRow: 2,
                      display: "grid",
                      gridTemplateRows: `repeat(${rows}, ${zoom}px)`,
                      background: COLORS.white,
                    }}
                  >
                    {Array.from({
                      length: rows,
                    }).map((_, row) => (
                      <div
                        key={`row-${row}`}
                        style={{
                          width: NUMBER_GUTTER,
                          height: zoom,
                          display: "grid",
                          placeItems: "center",
                          fontSize: Math.max(
                            8,
                            Math.min(
                              12,
                              zoom * 0.5
                            )
                          ),
                          color: COLORS.muted,
                          borderRight: `1px solid ${COLORS.border}`,
                          borderBottom: `1px solid ${COLORS.border}`,
                          boxSizing: "border-box",
                        }}
                      >
                        {row + 1}
                      </div>
                    ))}
                  </div>

                  <div
                    ref={boardRef}
                    style={{
                      gridColumn: 2,
                      gridRow: 2,
                      position: "relative",
                      width: columns * zoom,
                      height: rows * zoom,
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: columns * zoom,
                        height: rows * zoom,
                        imageRendering: "pixelated",
                        pointerEvents: "none",
                      }}
                    />

                    {marks.map((mark) => (
                      <button
                        key={mark.id}
                        type="button"
                        aria-label="X marcada"
                        onPointerDown={(event) => {
                          if (tool !== "erase") {
                            return;
                          }

                          event.preventDefault();
                          event.stopPropagation();

                          removeMarkById(mark.id);
                        }}
                        style={{
                          position: "absolute",
                          left: mark.x * zoom,
                          top: mark.y * zoom,
                          transform:
                            "translate(-50%, -50%)",
                          width: Math.max(
                            18,
                            zoom * 1.15
                          ),
                          height: Math.max(
                            18,
                            zoom * 1.15
                          ),
                          padding: 0,
                          margin: 0,
                          border: "none",
                          background: "transparent",
                          display: "grid",
                          placeItems: "center",
                          color: xColor,
                          fontSize: Math.max(
                            7,
                            zoom *
                              (xSize / 100)
                          ),
                          fontWeight: 700,
                          lineHeight: 1,
                          pointerEvents:
                            tool === "erase"
                              ? "auto"
                              : "none",
                          touchAction: "none",
                        }}
                      >
                        ×
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {imageSrc &&
          referenceOpen && (
            <aside
              onPointerDown={
                startReferenceDrag
              }
              onPointerMove={
                moveReference
              }
              onPointerUp={
                stopReferenceDrag
              }
              onPointerCancel={
                stopReferenceDrag
              }
              style={{
                position: "fixed",
                left: referencePosition.x,
                top: referencePosition.y,
                zIndex: 1300,
                width:
                  referenceMinimized
                    ? 190
                    : "min(310px, calc(100vw - 36px))",
                background: COLORS.white,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                boxShadow:
                  "0 8px 28px rgba(63, 63, 63, 0.22)",
                overflow: "hidden",
                touchAction: "none",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  height: 42,
                  padding: "0 8px 0 12px",
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
                    fontSize: 13,
                  }}
                >
                  Imagen de referencia
                </strong>

                <div
                  style={{
                    display: "flex",
                    gap: 5,
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
                      width: 30,
                      height: 30,
                      padding: 0,
                      border: "none",
                      borderRadius: 8,
                      background:
                        "rgba(255, 255, 255, 0.16)",
                      color: COLORS.white,
                      fontSize: 18,
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
                      width: 30,
                      height: 30,
                      padding: 0,
                      border: "none",
                      borderRadius: 8,
                      background:
                        "rgba(255, 255, 255, 0.16)",
                      color: COLORS.white,
                      fontSize: 18,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {!referenceMinimized && (
                <div
                  style={{
                    padding: 8,
                    background: COLORS.cream,
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
                      maxHeight: 360,
                      objectFit: "contain",
                      borderRadius: 8,
                      background: COLORS.white,
                      pointerEvents: "none",
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
