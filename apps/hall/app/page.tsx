import Header from "./_components/header"
import Image from "next/image"
import BarbershopItem from "./_components/barbershop-item"
import { db } from "@barbergo/database"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getServerSession } from "next-auth"
import { authOptions } from "./_lib/auth"
import Footer from "./_components/footer"
import Search from "./_components/search"
import HorizontalScroll from "./_components/horizontal-scroll"

interface HomeProps {
  searchParams: {
    search?: string
  }
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await getServerSession(authOptions)

  // 1. Busca Barbearias (sem filtro de favoritos por enquanto)
  const barbershops = await db.barbershop.findMany({
    where: searchParams.search ? {
      name: {
        contains: searchParams.search,
        mode: 'insensitive',
      }
    } : {},
    include: {
      ratings: true, // Importante para calcular a nota e passar para o item
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

  // 3. Ordenação por Melhor Avaliação (Cálculo em JS)
  const bestRatedBarbershops = [...barbershops].sort((a, b) => {
    const avgA = a.ratings.length > 0 ? a.ratings.reduce((sum, r) => sum + r.stars, 0) / a.ratings.length : 5.0
    const avgB = b.ratings.length > 0 ? b.ratings.reduce((sum, r) => sum + r.stars, 0) / b.ratings.length : 5.0
    return avgB - avgA // Decrescente
  })

  const currentDate = format(new Date(), "EEEE',' dd 'de' MMMM", {
    locale: ptBR,
  })

  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1)
  const userName = session?.user?.name?.split(" ")[0]

  return (
    <div className="h-full overflow-x-hidden bg-background min-h-screen">
      <Header />

      <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-5">
        <h2 className="text-xl font-bold text-white">
          {session?.user ? `Olá, ${userName}!` : "Olá, Faça seu login!"}
        </h2>

        <p className="capitalize text-sm text-gray-400 mt-1">
          {session?.user ? "Vamos agendar um corte hoje?" : formattedDate}
        </p>

        <Search />

        <div className="relative mt-6 h-[150px] md:h-[400px] w-full rounded-xl overflow-hidden hidden sm:block border border-secondary shadow-lg">
          <Image src="/banner2.svg" alt="Banner" fill className="object-cover" />
        </div>

        {/* SEÇÃO DE FAVORITOS (Só aparece se houver favoritos e usuário logado) */}
        {favoriteBarbershops.length > 0 && !searchParams.search && (
          <div className="mt-6">
            <h2 className="text-xs mb-3 uppercase text-gray-400 font-bold">Meus Favoritos</h2>
            <HorizontalScroll className="md:justify-center lg:justify-start">
              {favoriteBarbershops.map((shop) => (
                <BarbershopItem key={shop.id} barbershop={shop} />
              ))}
            </HorizontalScroll>
          </div>
        )}

        {/* RECOMENDADOS (Agora são "Mais Bem Avaliados") */}
        <div className="mt-6 mb-10">
          <h2 className="text-xs mb-3 uppercase text-gray-400 font-bold">
            {searchParams.search ? `Resultados para "${searchParams.search}"` : "Mais Bem Avaliados"}
          </h2>

          <HorizontalScroll className="md:justify-center lg:justify-start">
            {bestRatedBarbershops.length > 0 ? (
              bestRatedBarbershops.map((shop) => (
                <BarbershopItem key={shop.id} barbershop={shop} />
              ))
            ) : (
              <p className="text-sm text-gray-400">Nenhuma barbearia encontrada.</p>
            )}
          </HorizontalScroll>
        </div>

        {/* Populares (Mantendo a lista original sem ordenação específica ou usar views se tiver) */}
        {!searchParams.search && (
          <div className="mt-6 mb-[4.5rem]">
            <h2 className="text-xs mb-3 uppercase text-gray-400 font-bold">Populares</h2>

            <HorizontalScroll className="md:justify-center lg:justify-start">
              {barbershops.map((shop) => (
                <BarbershopItem key={shop.id} barbershop={shop} />
              ))}
            </HorizontalScroll>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}