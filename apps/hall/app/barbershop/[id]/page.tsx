import { db } from "@barbergo/database"
import BarbershopDetails from "./_components/barbershop-details"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"

interface BarbershopDetailsPageProps {
    params: {
        id: string
    }
}

export default async function BarbershopDetailsPage({ params }: BarbershopDetailsPageProps) {
    if (!params.id) return notFound()

    const barbershop = await db.barbershop.findUnique({
        where: {
            id: params.id,
        },
        include: {
            services: true,
            staff: {
                include: {
                    user: true
                }
            },
            ratings: true,
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
        })),
    }

    let isFavorited = false
    const session = await getServerSession(authOptions)

    if (session?.user) {
        const favorite = await db.favorite.findUnique({
            where: {
                userId_barbershopId: {
                    userId: (session.user as any).id,
                    barbershopId: params.id,
                },
            },
        })
        if (favorite) isFavorited = true
    }

    // @ts-ignore - staff agora está incluso no objeto
    return <BarbershopDetails barbershop={serializedBarbershop} initialIsFavorited={isFavorited} />
}