import { db } from "@barbergo/database"
import BarbershopDetails from "./barbershop-feature/components/barbershop-details"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { ViewTracker } from "@/_components/view-tracker"

export default async function ExclusiveHomePage() {
  const barbershopId = process.env.EXCLUSIVE_BARBERSHOP_ID

  if (!barbershopId) {
    console.error("EXCLUSIVE_BARBERSHOP_ID is not defined")
    return notFound()
  }

  const barbershop = await db.barbershop.findUnique({
    where: {
      id: barbershopId,
    },
    include: {
      services: {
        include: {
          staffPrices: true
        }
      },
      staff: {
        include: {
          user: true
        }
      },
      ratings: {
        include: {
          user: true
        }
      },
    },
  })

  if (!barbershop) {
    return notFound()
  }

  const serializedBarbershop = {
    ...barbershop,
    services: barbershop.services.map((service) => ({
      ...service,
      price: Number(service.price),
      staffPrices: service.staffPrices.map(sp => ({
        staffId: sp.staffId,
        price: Number(sp.price),
        isLinked: sp.isLinked
      }))
    })),
  }

  let isFavorited = false
  const session = await getServerSession(authOptions)

  if (session?.user) {
    const favorite = await db.favorite.findUnique({
      where: {
        userId_barbershopId: {
          userId: (session.user as any).id,
          barbershopId: barbershopId,
        },
      },
    })
    if (favorite) isFavorited = true
  }



  return (
    <>
      <ViewTracker barbershopId={barbershop.id} />
      <BarbershopDetails barbershop={serializedBarbershop} initialIsFavorited={isFavorited} />
    </>
  )
}