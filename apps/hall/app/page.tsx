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

// Interface para os parâmetros de busca da URL
interface HomeProps {
  searchParams: {
    search?: string
  }
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await getServerSession(authOptions)

  // Busca as barbearias filtrando pelo nome se houver um termo de pesquisa
  const barbershops = await db.barbershop.findMany({
    where: searchParams.search ? {
      name: {
        contains: searchParams.search,
        mode: 'insensitive', // Ignora maiúsculas/minúsculas
      }
    } : {},
  })

  const currentDate = format(new Date(), "EEEE',' dd 'de' MMMM", {
    locale: ptBR,
  })

  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1)
  const userName = session?.user?.name?.split(" ")[0]

  return (
    <div className="h-full">
      <Header />

      <div className="px-5 md:px-10 pt-5">
        <h2 className="text-xl font-bold">
          {session?.user ? `Olá, ${userName}!` : "Olá, Faça seu login!"}
        </h2>

        <p className="capitalize text-sm text-gray-03 mt-1">
          {session?.user ? "Vamos agendar um corte hoje?" : formattedDate}
        </p>

        {/* Substituímos o HTML estático pelo componente interativo */}
        <Search />

        <div className="relative mt-6 h-[400px] w-full rounded-xl overflow-hidden hidden md:block">
          <Image src="/banner-01.png" alt="Banner" fill className="object-cover" />
        </div>

        {/* Seção de resultados ou recomendações */}
        <div className="mt-6 mb-[4.5rem]">
          <h2 className="text-xs mb-3 uppercase text-gray-03 font-bold">
            {searchParams.search ? `Resultados para "${searchParams.search}"` : "Recomendados"}
          </h2>

          <div className="flex gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {barbershops.length > 0 ? (
              barbershops.map((shop) => (
                <BarbershopItem key={shop.id} barbershop={shop} />
              ))
            ) : (
              <p className="text-sm text-gray-400">Nenhuma barbearia encontrada.</p>
            )}
          </div>
        </div>

        {/* Exibe Populares apenas se não estiver buscando, ou mantenha como desejar */}
        {!searchParams.search && (
          <div className="mt-6 mb-[4.5rem]">
            <h2 className="text-xs mb-3 uppercase text-gray-03 font-bold">Populares</h2>
            <div className="flex gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {barbershops.map((shop) => (
                <BarbershopItem key={shop.id} barbershop={shop} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}