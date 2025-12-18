"use server"

import { authOptions } from "@/_lib/auth"
import { db } from "@barbergo/database"
import { getServerSession } from "next-auth"

export const getBarbershopSettings = async () => {
    const session = await getServerSession(authOptions)

    if (!session?.user) return null

    const barbershop = await db.barbershop.findFirst({
        where: {
            ownerId: (session.user as any).id,
        },
        include: {
            services: true,
            staff: true,
        },
    })

    if (!barbershop) return null

    return {
        ...barbershop,
        // CORREÇÃO: Removida tipagem restritiva no parâmetro do map
        services: barbershop.services.map((s) => ({
            ...s,
            price: s.price.toString(),
            description: s.description || ""
        })),
        staff: barbershop.staff.map((st) => ({
            ...st,
            email: st.email || ""
        }))
    }
}