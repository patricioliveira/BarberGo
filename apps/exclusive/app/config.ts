import { AppConfig } from "@barbergo/shared"

export const appConfig: AppConfig = {
  isExclusive: true,
  barbershopSlug: process.env.BARBERSHOP_SLUG,
  brandName: process.env.BRAND_NAME || "Barbearia",
  logoUrl: process.env.LOGO_URL || "/logo.png",
}