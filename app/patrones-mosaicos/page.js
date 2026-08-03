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

const pointDistance = (a, b) =>
  Math.hypot(b.x - a.x, b.y - a.y);

const pointCenter = (a, b) => ({
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
  const [marks, setMarks] = useState(new Set());

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
  const viewportRef = useRef(null);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef(null);
  const referenceDragRef = useRef(null);

  const cardStyle = {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "14px",
    boxShadow:
      "0 3px 12px rgba(63,63,63,.06)",
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
      const src = event.target.result;
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
        setMarks(new Set());

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

    if (!image) return;

    setRows(
      Math.max(
        5,
        Math.round(
          columns *
            (image.height / image.width)
        )
      )
    );

    setMarks(new Set());

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
        "rgba(63,63,63,.35)";

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

  const getCell = useCallback(
    (clientX, clientY) => {
      const viewport =
        viewportRef.current;

      if (!viewport || !rows) {
        return null;
      }

      const rect =
        viewport.getBoundingClientRect();

      const x =
        clientX -
        rect.left -
        boardOffset.x -
        NUMBER_GUTTER;

      const y =
        clientY -
        rect.top -
        boardOffset.y -
        TOP_GUTTER;

      const column = Math.floor(
        x / zoom
      );

      const row = Math.floor(
        y / zoom
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
      boardOffset,
      columns,
      rows,
      zoom,
    ]
  );

  const addMark = (key) => {
    if (!key) return;

    setMarks((previous) => {
      if (previous.has(key)) {
        return previous;
      }

      const next = new Set(previous);
      next.add(key);

      return next;
    });
  };

  const removeMark = (key) => {
    if (!key) return;

    setMarks((previous) => {
      if (!previous.has(key)) {
        return previous;
      }

      const next = new Set(previous);
      next.delete(key);

      return next;
    });
  };

  const onBoardPointerDown = (
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
      gestureRef.current = {
        type: "pinch",
        startDistance: Math.max(
          1,
          pointDistance(
            pointers[0],
            pointers[1]
          )
        ),
        startCenter: pointCenter(
          pointers[0],
          pointers[1]
        ),
        startZoom: zoom,
        startOffset: {
          ...boardOffset,
        },
      };

      return;
    }

    const key = getCell(
      event.clientX,
      event.clientY
    );

    if (!key) return;

    if (marks.has(key)) {
      gestureRef.current = {
        type: "move",
        source: key,
        destination: key,
      };

      return;
    }

    if (tool === "erase") {
      removeMark(key);

      gestureRef.current = {
        type: "erase",
        last: key,
      };
    } else {
      addMark(key);

      gestureRef.current = {
        type: "paint",
        last: key,
      };
    }
  };

  const onBoardPointerMove = (
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
      const first = pointers[0];
      const second = pointers[1];

      if (
        !gestureRef.current ||
        gestureRef.current.type !==
          "pinch"
      ) {
        gestureRef.current = {
          type: "pinch",
          startDistance: Math.max(
            1,
            pointDistance(
              first,
              second
            )
          ),
          startCenter: pointCenter(
            first,
            second
          ),
          startZoom: zoom,
          startOffset: {
            ...boardOffset,
          },
        };
      }

      const gesture =
        gestureRef.current;

      const center = pointCenter(
        first,
        second
      );

      const nextZoom = clamp(
        Math.round(
          gesture.startZoom *
            (pointDistance(
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
          center.x -
          (gesture.startCenter.x -
            gesture.startOffset.x) *
            ratio,
        y:
          center.y -
          (gesture.startCenter.y -
            gesture.startOffset.y) *
            ratio,
      });

      return;
    }

    const gesture =
      gestureRef.current;

    if (!gesture) return;

    const key = getCell(
      event.clientX,
      event.clientY
    );

    if (!key) return;

    if (gesture.type === "move") {
      gesture.destination = key;
      return;
    }

    if (key === gesture.last) {
      return;
    }

    gesture.last = key;

    if (gesture.type === "paint") {
      addMark(key);
    }

    if (gesture.type === "erase") {
      removeMark(key);
    }
  };

  const onBoardPointerEnd = (
    event
  ) => {
    pointersRef.current.delete(
      event.pointerId
    );

    const gesture =
      gestureRef.current;

    if (
      gesture?.type === "move" &&
      gesture.source &&
      gesture.destination
    ) {
      setMarks((previous) => {
        const next = new Set(previous);

        next.delete(gesture.source);
        next.add(gesture.destination);

        return next;
      });
    }

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

    referenceDragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: referencePosition.x,
     
