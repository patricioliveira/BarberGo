"use server"

import { db } from "@barbergo/database"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const getUserNotifications = async () => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return []

    // Busca agendamentos que mudaram de status recentemente ou solicitações
    return await db.booking.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            barbershop: true,
            service: true
        },
        orderBy: {
            updatedAt: 'desc'
        },
        take: 10
    })
}