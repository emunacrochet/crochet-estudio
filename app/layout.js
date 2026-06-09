import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SessionProvider } from "./SessionProvider";
import "./globals.css";
import LogoutButton from "./LogoutButton";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Emuná Crochet Estudio",
  description: "Herramientas para diseño crochet",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={bodyStyle}>
        <SessionProvider>
          <header style={header}>
            <Link href="/" style={logoLink}>
              Emuná Crochet Estudio
            </Link>

            <nav style={nav}>
              <Link href="/" style={link}>Inicio</Link>
              <Link href="/pixelador" style={link}>Pixelador</Link>
              <Link href="/cuadricula-crochet" style={link}>Cuadrícula</Link>
              <Link href="/tablero-inspiracion" style={link}>Inspiración</Link>
              <Link href="/intervenir-prendas" style={link}>Intervenir</Link>
              <Link href="/muestra-tension" style={link}>Tensión</Link>
              <Link href="/mi-proyecto" style={link}>Mi Proyecto</Link>
            </nav>
           <div style={logoutWrapper}>
  <LogoutButton />
</div>
          </header>

          <div style={mainWrapper}>
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}

const bodyStyle = {
  margin: 0,
  background: "#f5f1ea",
  color: "#222",
  minHeight: "100vh",
  fontFamily: "Georgia, serif",
  overflowX: "hidden",
};

const header = {
  width: "100%",
  background: "#f5f1ea",
  borderBottom: "1px solid #e8dfd4",
  padding: "14px 10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  boxSizing: "border-box",
};

const logoLink = {
  textDecoration: "none",
  color: "#2f221c",
  fontSize: "clamp(24px, 6vw, 36px)",
  fontWeight: "bold",
  textAlign: "center",
  lineHeight: "1.1",
};

const nav = {
  width: "100%",
  maxWidth: "900px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "10px",
  justifyContent: "center",
};

const link = {
  textDecoration: "none",
  color: "#222",
  background: "white",
  padding: "10px 8px",
  borderRadius: "12px",
  border: "1px solid #e5dbcf",
  fontSize: "14px",
  textAlign: "center",
  fontWeight: "bold",
};

const mainWrapper = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
  boxSizing: "border-box",
};
const logoutWrapper = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
};