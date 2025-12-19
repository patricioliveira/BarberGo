import { db } from "@barbergo/database"
import BarbershopDetails from "./_components/barbershop-details"
import { notFound } from "next/navigation"

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
    
    // @ts-ignore - staff agora está incluso no objeto
    return <BarbershopDetails barbershop={serializedBarbershop} />
}