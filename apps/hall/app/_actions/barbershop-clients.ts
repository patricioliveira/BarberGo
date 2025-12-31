"use server"

import { db } from "@barbergo/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { startOfMonth, endOfMonth } from "date-fns"

export const getBarbershopClients = async () => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return []

    const barbershop = await db.barbershop.findFirst({
        where: { ownerId: (session.user as any).id },
        include: { blockedUsers: true }
    })

    if (!barbershop) return []

    // Busca agendamentos agrupados por usuário
    const bookings = await db.booking.findMany({
        where: { barbershopId: barbershop.id },
        include: { service: true }
    })

    // Extrai IDs únicos de usuários (filtrando nulos de agendamentos manuais)
    const userIds = Array.from(new Set(bookings.map(b => b.userId).filter(id => id !== null))) as string[]

    // Busca dados dos usuários
    const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, image: true, UserPhone: true }
    })

    // Monta as estatísticas
    const clientsData = users.map(user => {
        const userBookings = bookings.filter(b => b.userId === user.id)
        const isBlocked = barbershop.blockedUsers.some(block => block.userId === user.id)

        // Cálculos
        const totalSpent = userBookings
            .filter(b => b.status === "COMPLETED" || b.status === "CONFIRMED")
            .reduce((acc, curr) => acc + Number(curr.service.price), 0)

        const now = new Date()
        const monthBookings = userBookings.filter(b =>
            b.date >= startOfMonth(now) && b.date <= endOfMonth(now)
        )
        const monthSpent = monthBookings
            .filter(b => b.status === "COMPLETED" || b.status === "CONFIRMED")
            .reduce((acc, curr) => acc + Number(curr.service.price), 0)

        const serviceStats: Record<string, number> = {}
        userBookings.filter(b => b.status !== "CANCELED").forEach(b => {
            serviceStats[b.service.name] = (serviceStats[b.service.name] || 0) + Number(b.service.price)
        })

        return {
            user,
            stats: {
                totalSpent,
                monthSpent,
                completedCount: userBookings.filter(b => b.status === "COMPLETED" || (b.status === "CONFIRMED" && b.date < now)).length,
                canceledCount: userBookings.filter(b => b.status === "CANCELED").length,
                pendingCount: userBookings.filter(b => b.status === "CONFIRMED" && b.date >= now).length,
                serviceStats
            },
            isBlocked
        }
    })

    return clientsData
}

export const toggleClientBlock = async (userId: string) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Não autorizado")

    const barbershop = await db.barbershop.findFirst({
        where: { ownerId: (session.user as any).id }
    })
    if (!barbershop) throw new Error("Barbearia não encontrada")

    const existing = await db.barbershopBlock.findUnique({
        where: { barbershopId_userId: { barbershopId: barbershop.id, userId } }
    })

    if (existing) {
        await db.barbershopBlock.delete({ where: { id: existing.id } })
        return { blocked: false }
    } else {
        await db.barbershopBlock.create({ data: { barbershopId: barbershop.id, userId } })
        return { blocked: true }
    }
}