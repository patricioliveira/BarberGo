// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./_providers/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "BarberGo CRM",
    description: "Gestão para Barbearias",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" className="dark">
            <body className={`${inter.className} bg-background text-white antialiased`}>
                {/* O componente agora está definido e importado */}
                <AuthProvider>
                    <div className="flex-1">
                        {children}
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
