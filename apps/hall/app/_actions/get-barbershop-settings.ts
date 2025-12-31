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
            services: {
                include: {
                    staffPrices: true,
                    promotions: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            } as any,
            staff: true,
            subscription: true
        },
    })

    if (!barbershop) return null

    return {
        ...barbershop,
        services: barbershop.services.map((s: any) => ({
            ...s,
            price: s.price.toString(),
            description: s.description || "",
            staffPrices: s.staffPrices.map((sp: { price: { toString: () => any } }) => ({
                ...sp,
                price: sp.price.toString()
            })),
            promotion: s.promotions[0] // Attach the active promotion if any
        })),
        staff: barbershop.staff.map((st) => ({
            ...st,
            email: st.email || ""
        }))
    }
}