export interface AppConfig {
  isExclusive: boolean
  barbershopSlug?: string
  brandName: string
  logoUrl: string
}

export interface BarbershopData {
  id: string
  name: string
  slug: string
  address: string
  phones: string[]
  description: string
  imageUrl: string
  isExclusive: boolean
}