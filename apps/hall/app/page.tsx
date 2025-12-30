import HomeClient from "./_components/home-client"
import { db } from "@barbergo/database"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getServerSession } from "next-auth"
import { authOptions } from "./_lib/auth"

interface HomeProps {
  searchParams: {
    search?: string
  }
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await getServerSession(authOptions)

  // 1. Busca Barbearias
  const barbershops = await db.barbershop.findMany({
    where: searchParams.search ? {
      name: {
        contains: searchParams.search,
        mode: 'insensitive',
      }
    } : {},
    include: {
      ratings: true,
    }
  })

  // 2. Busca Favoritos (apenas se logado)
  const favorites = session?.user ? await db.favorite.findMany({
    where: { userId: (session.user as any).id },
    include: {
      barbershop: {
        include: { ratings: true }
      }
    }
  }) : []

  const favoriteBarbershops = favorites.map(f => f.barbershop)

  // Sort initial results by rating (default view)
  const initialBarbershops = [...barbershops].sort((a, b) => {
    const avgA = a.ratings.length > 0 ? a.ratings.reduce((sum, r) => sum + r.stars, 0) / a.ratings.length : 5.0
    const avgB = b.ratings.length > 0 ? b.ratings.reduce((sum, r) => sum + r.stars, 0) / b.ratings.length : 5.0
    return avgB - avgA
  })

  const currentDate = format(new Date(), "EEEE',' dd 'de' MMMM", {
    locale: ptBR,
  })

  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1)
  const userName = session?.user?.name?.split(" ")[0]

  return (
    <HomeClient
      initialBarbershops={initialBarbershops}
      initialFavorites={favoriteBarbershops}
      userName={userName}
      formattedDate={formattedDate}
      defaultSearch={searchParams.search}
    />
  )
}