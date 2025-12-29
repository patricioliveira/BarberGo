import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@barbergo/ui"

import { appConfig } from "./config"
import AuthProvider from "./_providers/auth"
import Footer from "./_components/footer"
import { db } from "@barbergo/database"
import { ThemeProvider } from "./_components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: appConfig.brandName,
  description: `${appConfig.brandName} - Agende seu horário`,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const barbershopId = process.env.EXCLUSIVE_BARBERSHOP_ID
  let themeConfig = null

  if (barbershopId) {
    const barbershop = await db.barbershop.findUnique({
      where: { id: barbershopId },
      select: { themeConfig: true }
    })
    themeConfig = (barbershop as any)?.themeConfig
  }

  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            primaryColor={themeConfig?.primaryColor}
            secondaryColor={themeConfig?.secondaryColor}
          >
            <div className="flex h-full flex-col">
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}