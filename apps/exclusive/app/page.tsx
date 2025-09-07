import { redirect } from "next/navigation"
import { db } from "@barbergo/database"
import { appConfig } from "./config"

const Home = async () => {
  if (!appConfig.barbershopSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">
          Configuração de barbearia não encontrada
        </p>
      </div>
    )
  }

  const barbershop = await db.barbershop.findFirst({
    where: {
      slug: appConfig.barbershopSlug,
      isExclusive: true,
    },
  })

  if (!barbershop) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Barbearia não encontrada</p>
      </div>
    )
  }

  redirect(`/barbershop/${barbershop.id}`)
}

export default Home