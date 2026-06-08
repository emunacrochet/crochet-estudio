"use client";
import AuthGuard from "../AuthGuard";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../SessionProvider";
export default function MiProyecto() {
  const { session } = useSession();

const [proyectosGuardados, setProyectosGuardados] = useState([]);
 
const [inspiracion, setInspiracion] = useState(null);
  const [intervencion, setIntervencion] = useState(null);
  const [muestra, setMuestra] = useState(null);
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [notas, setNotas] = useState("");
const [estadoProyecto, setEstadoProyecto] = useState("Planificado");

const [fechaInicio, setFechaInicio] = useState("");

const [fechaFin, setFechaFin] = useState("");

const [tipoHilo, setTipoHilo] = useState("");

const [marcaHilo, setMarcaHilo] = useState("");

const [colorPrincipal, setColorPrincipal] = useState("");

const [aguja, setAguja] = useState("");

const [fotosProyecto, setFotosProyecto] = useState([]);
const [proyectoEditandoId, setProyectoEditandoId] = useState(null);
  useEffect(() => {
    async function cargarProyectos() {

  if (!session) return;

  const { data, error } = await supabase
  .from("proyectos")
  .select("*")
  .eq("user_id", session.user.id)
  .order("favorito", { ascending: false })
  .order("created_at", { ascending: false });

  if (!error && data) {
    setProyectosGuardados(data);
  }
}
    const ideaGuardada = localStorage.getItem("ideaSeleccionada");
    const intervencionGuardada = localStorage.getItem("intervencionActual");
   const muestraGuardada = localStorage.getItem("muestraTensionActual");
    const nombreGuardado = localStorage.getItem("nombreProyectoEmuna");
    const notasGuardadas = localStorage.getItem("notasProyectoEmuna");

    if (ideaGuardada) {
      setInspiracion(JSON.parse(ideaGuardada));
    }

    if (intervencionGuardada) {
      setIntervencion(JSON.parse(intervencionGuardada));
    }
if (muestraGuardada) {
  setMuestra(JSON.parse(muestraGuardada));
}
    if (nombreGuardado) {
      setNombreProyecto(nombreGuardado);
    }

    if (notasGuardadas) {
      setNotas(notasGuardadas);
    }
    cargarProyectos();
  }, [session]);
function abrirProyecto(proyecto) {
  localStorage.setItem(
    "pixeladorProyectoAbierto",
    JSON.stringify({
      id: proyecto.id,
      nombre: proyecto.nombre,
      pixels: proyecto.contenido?.pixels || [],
      colors: proyecto.contenido?.colors || [],
      gridWidth: proyecto.contenido?.gridWidth || 28,
      gridHeight: proyecto.contenido?.gridHeight || 28,
    })
  );

  window.location.href = "/pixelador";
}
async function eliminarProyecto(id) {

  const confirmar = confirm(
    "¿Querés eliminar este proyecto?"
  );

  if (!confirmar) return;

  const { error } = await supabase
    .from("proyectos")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error al eliminar");
    return;
  }

  setProyectosGuardados(
    proyectosGuardados.filter(
      (proyecto) => proyecto.id !== id
    )
  );

  alert("Proyecto eliminado");
}
async function toggleFavorito(proyecto) {

  const { error } = await supabase
    .from("proyectos")
    .update({
      favorito: !proyecto.favorito,
    })
    .eq("id", proyecto.id);

  if (error) {
    alert("Error al actualizar favorito");
    return;
  }

  setProyectosGuardados(
    proyectosGuardados.map((p) =>
      p.id === proyecto.id
        ? { ...p, favorito: !p.favorito }
        : p
    )
  );
}
function subirFotosProyecto(e) {
  function cargarProyectoParaEditar(proyecto) {

  setProyectoEditandoId(proyecto.id);

  setNombreProyecto(proyecto.nombre || "");

  setEstadoProyecto(
    proyecto.contenido?.ficha?.estadoProyecto || "Planificado"
  );

  setFechaInicio(
    proyecto.contenido?.ficha?.fechaInicio || ""
  );

  setFechaFin(
    proyecto.contenido?.ficha?.fechaFin || ""
  );

  setTipoHilo(
    proyecto.contenido?.ficha?.tipoHilo || ""
  );

  setMarcaHilo(
    proyecto.contenido?.ficha?.marcaHilo || ""
  );

  setColorPrincipal(
    proyecto.contenido?.ficha?.colorPrincipal || ""
  );

  setAguja(
    proyecto.contenido?.ficha?.aguja || ""
  );

  setFotosProyecto(
    proyecto.contenido?.ficha?.fotosProyecto || []
  );

  setNotas(
    proyecto.contenido?.notas || ""
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
  const archivos = Array.from(e.target.files || []);

  archivos.forEach((archivo) => {
    const lector = new FileReader();

    lector.onload = () => {
      setFotosProyecto((fotosActuales) => [
        ...fotosActuales,
        lector.result,
      ]);
    };

    lector.readAsDataURL(archivo);
  });
}
function cargarProyectoParaEditar(proyecto) {
  setProyectoEditandoId(proyecto.id);

  setNombreProyecto(proyecto.nombre || "");

  setEstadoProyecto(
    proyecto.contenido?.ficha?.estadoProyecto || "Planificado"
  );

  setFechaInicio(
    proyecto.contenido?.ficha?.fechaInicio || ""
  );

  setFechaFin(
    proyecto.contenido?.ficha?.fechaFin || ""
  );

  setTipoHilo(
    proyecto.contenido?.ficha?.tipoHilo || ""
  );

  setMarcaHilo(
    proyecto.contenido?.ficha?.marcaHilo || ""
  );

  setColorPrincipal(
    proyecto.contenido?.ficha?.colorPrincipal || ""
  );

  setAguja(
    proyecto.contenido?.ficha?.aguja || ""
  );

  setFotosProyecto(
    proyecto.contenido?.ficha?.fotosProyecto || []
  );

  setNotas(
    proyecto.contenido?.notas || ""
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
async function guardarProyecto() {
  localStorage.setItem("nombreProyectoEmuna", nombreProyecto);
  localStorage.setItem("notasProyectoEmuna", notas);

  if (!session) {
    alert("Debés iniciar sesión");
    return;
  }

  const datosProyecto = {
    user_id: session.user.id,
    nombre: nombreProyecto || "Proyecto sin nombre",
    contenido: {
      ficha: {
        estadoProyecto,
        fechaInicio,
        fechaFin,
        tipoHilo,
        marcaHilo,
        colorPrincipal,
        aguja,
        fotosProyecto,
      },
      inspiracion,
      intervencion,
      muestra,
      notas,
    },
    tipo: "mi-proyecto",
  };

  let error;

  if (proyectoEditandoId) {
    const resultado = await supabase
      .from("proyectos")
      .update(datosProyecto)
      .eq("id", proyectoEditandoId)
      .eq("user_id", session.user.id);

    error = resultado.error;
  } else {
    const resultado = await supabase
      .from("proyectos")
      .insert([datosProyecto]);

    error = resultado.error;
  }

  if (error) {
    alert("Error al guardar");
    return;
  }

  alert(proyectoEditandoId ? "Proyecto actualizado" : "Proyecto guardado en la nube");

  setProyectoEditandoId(null);

  const { data } = await supabase
    .from("proyectos")
    .select("*")
    .eq("user_id", session.user.id)
    .order("favorito", { ascending: false })
    .order("created_at", { ascending: false });

  if (data) {
    setProyectosGuardados(data);
  }
}

  function borrarInspiracion() {
    localStorage.removeItem("ideaSeleccionada");
    setInspiracion(null);
  }

  function borrarIntervencion() {
    localStorage.removeItem("intervencionActual");
    setIntervencion(null);
  }

  return (
  <AuthGuard>
    <main style={page}>
      <Link href="/">
        <button style={backButton}>← Volver al inicio</button>
      </Link>

      <h1 style={title}>Mi Proyecto</h1>

      <p style={intro}>
        Este es el espacio donde se reúne tu inspiración, tus pruebas,
        intervenciones y notas para desarrollar una idea de crochet.
      </p>
{proyectosGuardados.length > 0 && (
  <section style={card}>

    <h2 style={sectionTitle}>
      Proyectos guardados
    </h2>

    {proyectosGuardados.map((proyecto) => (

  <div key={proyecto.id} style={savedProject}>

    <strong>
      {proyecto.nombre}
    </strong>

    <p>
      {new Date(proyecto.created_at).toLocaleDateString()}
    </p>

    {proyecto.tipo === "mi-proyecto" && (
      <>
        <p><strong>Estado:</strong> {proyecto.contenido?.ficha?.estadoProyecto}</p>
        <p><strong>Inicio:</strong> {proyecto.contenido?.ficha?.fechaInicio}</p>
        <p><strong>Fin:</strong> {proyecto.contenido?.ficha?.fechaFin}</p>
        <p><strong>Hilo/Lana:</strong> {proyecto.contenido?.ficha?.tipoHilo}</p>
        <p><strong>Marca:</strong> {proyecto.contenido?.ficha?.marcaHilo}</p>
        <p><strong>Color:</strong> {proyecto.contenido?.ficha?.colorPrincipal}</p>
        <p><strong>Aguja:</strong> {proyecto.contenido?.ficha?.aguja}</p>

        {proyecto.contenido?.notas && (
          <p><strong>Notas:</strong> {proyecto.contenido.notas}</p>
        )}

        {proyecto.contenido?.ficha?.fotosProyecto?.length > 0 && (
          <div style={photoGrid}>
            {proyecto.contenido.ficha.fotosProyecto.map((foto, index) => (
              <img
                key={index}
                src={foto}
                alt=""
                style={projectPhoto}
              />
            ))}
          </div>
        )}
      </>
    )}

    <button
      style={saveButton}
      onClick={() => toggleFavorito(proyecto)}
    >
      {proyecto.favorito ? "★ Favorito" : "☆ Favorito"}
    </button>

    {proyecto.tipo === "pixelador" && (
      <button
        style={saveButton}
        onClick={() => abrirProyecto(proyecto)}
      >
        Abrir proyecto
      </button>
    )}
<button
  style={saveButton}
  onClick={() => cargarProyectoParaEditar(proyecto)}
>
  Editar
</button>
    <button
      style={deleteButton}
      onClick={() => eliminarProyecto(proyecto.id)}
    >
      Eliminar
    </button>

  </div>

))}
  </section>
)}
      <section style={card}>
  <h2 style={sectionTitle}>Ficha del proyecto</h2>

  <input
    style={input}
    placeholder="Nombre del proyecto"
    value={nombreProyecto}
    onChange={(e) => setNombreProyecto(e.target.value)}
  />

  <select
    style={input}
    value={estadoProyecto}
    onChange={(e) => setEstadoProyecto(e.target.value)}
  >
    <option>Planificado</option>
    <option>En proceso</option>
    <option>Terminado</option>
  </select>

  <input
    style={input}
    type="date"
    value={fechaInicio}
    onChange={(e) => setFechaInicio(e.target.value)}
  />

  <input
    style={input}
    type="date"
    value={fechaFin}
    onChange={(e) => setFechaFin(e.target.value)}
  />

  <input
    style={input}
    placeholder="Hilo / Lana"
    value={tipoHilo}
    onChange={(e) => setTipoHilo(e.target.value)}
  />

  <input
    style={input}
    placeholder="Marca"
    value={marcaHilo}
    onChange={(e) => setMarcaHilo(e.target.value)}
  />

  <input
    style={input}
    placeholder="Color principal"
    value={colorPrincipal}
    onChange={(e) => setColorPrincipal(e.target.value)}
  />

  <input
    style={input}
    placeholder="Aguja"
    value={aguja}
    onChange={(e) => setAguja(e.target.value)}
  />
  <label style={uploadBox}>
  Subir fotos del proceso o dibujo del diseño

  <input
    type="file"
    accept="image/*"
    multiple
    onChange={subirFotosProyecto}
    style={{ display: "none" }}
  />
</label>

{fotosProyecto.length > 0 && (
  <div style={photoGrid}>
    {fotosProyecto.map((foto, index) => (
      <img
        key={index}
        src={foto}
        alt=""
        style={projectPhoto}
      />
    ))}
  </div>
)}

</section>
      {inspiracion && (
        <section style={card}>
          <h2 style={sectionTitle}>Inspiración seleccionada</h2>

          {inspiracion.imagen && (
            <img
              src={inspiracion.imagen}
              alt=""
              style={image}
            />
          )}

          <h3>{inspiracion.titulo}</h3>

          <p>{inspiracion.nota}</p>

          {inspiracion.transformacion && (
            <p>
              <strong>Transformación:</strong>{" "}
              {inspiracion.transformacion}
            </p>
          )}

          {inspiracion.aplicacion && (
            <p>
              <strong>Aplicación:</strong>{" "}
              {inspiracion.aplicacion}
            </p>
          )}

          <button style={deleteButton} onClick={borrarInspiracion}>
            Quitar inspiración
          </button>
        </section>
      )}

      {intervencion && (
        <section style={card}>
          <h2 style={sectionTitle}>Intervención de prenda</h2>
{muestra && (
  <section style={card}>
    <h2 style={sectionTitle}>Muestra de tensión</h2>

    <p>
      <strong>Puntos:</strong> {muestra.puntos}
    </p>

    <p>
      <strong>Vueltas:</strong> {muestra.vueltas}
    </p>

    <p>
      <strong>Gancho:</strong> {muestra.gancho}
    </p>

    <p>
      <strong>Diferencia:</strong> {muestra.diferencia}%
    </p>

    <p>
      <strong>Escala aproximada:</strong> {muestra.escala}
    </p>

    <p>
      <strong>Fecha:</strong> {muestra.fecha}
    </p>
  </section>
)}
          {intervencion.imagen && (
            <img
              src={intervencion.imagen}
              alt=""
              style={image}
            />
          )}

          {intervencion.fecha && (
            <p>
              <strong>Fecha:</strong> {intervencion.fecha}
            </p>
          )}

          {intervencion.notas && (
            <p>
              <strong>Notas de intervención:</strong>{" "}
              {intervencion.notas}
            </p>
          )}

       <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
  <button
    style={deleteButton}
    onClick={borrarIntervencion}
  >
    Quitar intervención
  </button>

  
</div>
</section>
)}
      {!inspiracion && !intervencion && (
        <section style={emptyCard}>
          <h2 style={sectionTitle}>Todavía no hay elementos guardados</h2>

          <p>
            Podés enviar una inspiración desde el Tablero Inspiracional o una
            intervención desde Intervenir Prendas.
          </p>
        </section>
      )}

      <section style={card}>
        <h2 style={sectionTitle}>Notas del proyecto</h2>

        <textarea
          style={textarea}
          placeholder="Escribí decisiones, materiales, colores, cambios, pruebas o próximos pasos..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
        <button style={saveButton} onClick={guardarProyecto}>
          Guardar proyecto
        </button>
      </section>
       </main>
  </AuthGuard>
);
}

const page = {
  minHeight: "100vh",
  background: "#f5f1ea",
  padding: "32px 20px",
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
  fontSize: "64px",
  marginBottom: "18px",
};

const intro = {
  fontSize: "22px",
  lineHeight: "1.6",
  maxWidth: "900px",
  marginBottom: "34px",
};

const card = {
  background: "white",
  borderRadius: "28px",
  padding: "26px",
  marginBottom: "28px",
};

const emptyCard = {
  background: "#fff7ef",
  borderRadius: "28px",
  padding: "26px",
  marginBottom: "28px",
};

const sectionTitle = {
  fontSize: "34px",
  marginBottom: "18px",
};

const input = {
  width: "100%",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid #ddd",
  fontSize: "18px",
};

const textarea = {
  width: "100%",
  minHeight: "170px",
  padding: "16px",
  borderRadius: "18px",
  border: "1px solid #ddd",
  fontSize: "18px",
  fontFamily: "Georgia, serif",
  marginBottom: "18px",
};

const image = {
  width: "100%",
  maxWidth: "520px",
  borderRadius: "20px",
  marginBottom: "20px",
  display: "block",
};

const saveButton = {
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: "14px",
  padding: "14px 20px",
  cursor: "pointer",
  fontSize: "18px",
  fontWeight: "bold",
};

const deleteButton = {
  background: "#d88f7a",
  color: "white",
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  cursor: "pointer",
  fontSize: "16px",
  marginTop: "12px",
};
const savedProject = {
  background: "#f8f3ed",
  borderRadius: "18px",
  padding: "16px",
  marginBottom: "14px",
  border: "1px solid #e8ddd2",
};
const uploadBox = {
  display: "block",
  background: "#111",
  color: "white",
  padding: "14px 18px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "14px",
  textAlign: "center",
};

const photoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: "12px",
  marginTop: "18px",
};

const projectPhoto = {
  width: "100%",
  height: "140px",
  objectFit: "cover",
  borderRadius: "16px",
};