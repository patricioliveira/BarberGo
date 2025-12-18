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

    // CORREÇÃO: Converter Decimal para Number para o Next.js aceitar
    const serializedBarbershop = {
        ...barbershop,
        services: barbershop.services.map((service) => ({
            ...service,
            price: Number(service.price),
        })),
    }

    return <BarbershopDetails barbershop={serializedBarbershop} />
}