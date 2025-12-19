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
import HorizontalScroll from "./_components/horizontal-scroll" // Importe o componente

interface HomeProps {
  searchParams: {
    search?: string
  }
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await getServerSession(authOptions)

  const barbershops = await db.barbershop.findMany({
    where: searchParams.search ? {
      name: {
        contains: searchParams.search,
        mode: 'insensitive',
      }
    } : {},
  })

  const currentDate = format(new Date(), "EEEE',' dd 'de' MMMM", {
    locale: ptBR,
  })

  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1)
  const userName = session?.user?.name?.split(" ")[0]

  return (
    <div className="h-full overflow-x-hidden">
      <Header />

      <div className="px-5 md:px-10 pt-5">
        <h2 className="text-xl font-bold">
          {session?.user ? `Olá, ${userName}!` : "Olá, Faça seu login!"}
        </h2>

        <p className="capitalize text-sm text-gray-400 mt-1">
          {session?.user ? "Vamos agendar um corte hoje?" : formattedDate}
        </p>

        <Search />

        <div className="relative mt-6 h-[400px] w-full rounded-xl overflow-hidden hidden md:block">
          <Image src="/banner-01.png" alt="Banner" fill className="object-cover" />
        </div>

        {/* Recomendados / Resultados */}
        <div className="mt-6 mb-10">
          <h2 className="text-xs mb-3 uppercase text-gray-400 font-bold">
            {searchParams.search ? `Resultados para "${searchParams.search}"` : "Recomendados"}
          </h2>

          <HorizontalScroll>
            {barbershops.length > 0 ? (
              barbershops.map((shop) => (
                <BarbershopItem key={shop.id} barbershop={shop} />
              ))
            ) : (
              <p className="text-sm text-gray-400">Nenhuma barbearia encontrada.</p>
            )}
          </HorizontalScroll>
        </div>

        {/* Populares */}
        {!searchParams.search && (
          <div className="mt-6 mb-[4.5rem]">
            <h2 className="text-xs mb-3 uppercase text-gray-400 font-bold">Populares</h2>

            <HorizontalScroll>
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