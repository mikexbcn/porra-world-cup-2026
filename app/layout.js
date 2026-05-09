import "./globals.css"; // <--- ESTA LÍNEA ES EL "CABLE" QUE FALTA

export const metadata = {
  title: "World Cup 2026",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}