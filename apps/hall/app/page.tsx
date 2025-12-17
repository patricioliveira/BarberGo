import Header from "./_components/header"
import { Input, Button } from "@barbergo/ui"
import { SearchIcon } from "lucide-react"
import Image from "next/image"
import BarbershopItem from "./_components/barbershop-item"
import { db } from "@barbergo/database"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function Home() {
  const barbershops = await db.barbershop.findMany({})

  // Data formatada: "Sexta, 02 de Fevereiro"
  const currentDate = format(new Date(), "EEEE',' dd 'de' MMMM", {
    locale: ptBR,
  })

  // Capitalizar a primeira letra da data
  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1)

  return (
    <div className="h-full">
      <Header />

      <div className="px-5 pt-5">
        {/* Saudação */}
        <h2 className="text-xl font-bold">Olá, Faça seu login!</h2>
        <p className="capitalize text-sm text-gray-03 mt-1">
          {formattedDate}
        </p>

        {/* Busca */}
        <div className="flex items-center gap-2 mt-6">
          <Input
            placeholder="Buscar Barbearias"
            className="bg-card border-none rounded-xl text-gray-03"
          />
          <Button size="icon" className="bg-primary hover:bg-primary/80 rounded-xl">
            <SearchIcon size={20} />
          </Button>
        </div>

        {/* Banner (Opcional - Se tiver no design, caso contrário removemos) */}
        {/* <div className="relative mt-6 h-[150px] w-full rounded-xl overflow-hidden hidden md:block">
             <Image src="/banner-01.png" alt="Banner" fill className="object-cover" />
        </div> */}

        {/* Recomendados (Scroll Horizontal) */}
        <div className="mt-6 mb-[4.5rem]">
          <h2 className="text-xs mb-3 uppercase text-gray-03 font-bold">Recomendados</h2>

          <div className="flex gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {barbershops.map((shop) => (
              <BarbershopItem key={shop.id} barbershop={shop} />
            ))}
          </div>
        </div>

        {/* Populares (Scroll Horizontal) */}
        <div className="mt-6 mb-[4.5rem]">
          <h2 className="text-xs mb-3 uppercase text-gray-03 font-bold">Populares</h2>

          <div className="flex gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {barbershops.map((shop) => (
              <BarbershopItem key={shop.id} barbershop={shop} />
            ))}
          </div>
        </div>
      </div>

      <footer className="w-full bg-card py-6 px-5 border-t border-border">
        <p className="text-gray-03 text-xs font-bold opacity-75">
          © 2026 Copyright BarberGO
        </p>
      </footer>
    </div>
  )
}