import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Importa os estilos que criamos
import { Toaster } from "@barbergo/ui"; // Importa o Toaster do pacote de UI
import AuthProvider from "./_providers/auth"; // Importa o AuthProvider

const inter = Inter({ subsets: ["latin"] });

// Define o Viewport separadamente (recomendado no Next 14+)
export const viewport: Viewport = {
  themeColor: "#815b40",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "BarberGo",
  description: "Agende seu corte",
  manifest: "/manifest.json", // Link para o arquivo criado
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BarberGo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* Ícone para iPhone */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex-1">
            {children}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}