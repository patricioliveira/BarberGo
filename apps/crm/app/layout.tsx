import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@barbergo/ui";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CRM | BarberGo Admin",
    description: "Gestão Centralizada do SaaS BarberGo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" className="dark">
            <body className={`${inter.className} bg-background text-white antialiased`}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}