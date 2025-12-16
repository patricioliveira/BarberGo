import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@barbergo/ui"

import { appConfig } from "./config"
import AuthProvider from "./_providers/auth"
import Footer from "./_components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: appConfig.brandName,
  description: `${appConfig.brandName} - Agende seu horário`,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex h-full flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}