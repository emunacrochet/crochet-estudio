export default function PruebaFinalizada() {
  return (
    <main style={page}>
      <section style={card}>

        <h1 style={titulo}>
          Tu prueba gratuita terminó
        </h1>

        <p style={texto}>
          Gracias por usar Emuná Crochet Estudio.
        </p>

        <p style={texto}>
          Para seguir utilizando todas las herramientas,
          activá tu membresía mensual de USD 9.
        </p>

        <button style={boton}>
          Activar membresía
        </button>

      </section>
    </main>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f5f1ea",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const card = {
  width: "100%",
  maxWidth: "520px",
  background: "white",
  padding: "40px",
  borderRadius: "28px",
  border: "1px solid #eadfd5",
  textAlign: "center",
};

const titulo = {
  fontSize: "42px",
  color: "#2f221c",
  marginBottom: "20px",
};

const texto = {
  color: "#6b625d",
  lineHeight: "1.7",
  marginBottom: "16px",
  fontSize: "18px",
};

const boton = {
  marginTop: "20px",
  padding: "16px 24px",
  borderRadius: "16px",
  border: "none",
  background: "#3f2e27",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
};