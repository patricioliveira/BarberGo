"use server"

import { db } from "@barbergo/database"
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const getAdminDashboard = async () => {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // 1. Identificar quem é o usuário e incluir a relação correta: managedBarbershops
    const user = await db.user.findUnique({
        where: { id: (session.user as any).id },
        include: {
            staffProfile: true,
            managedBarbershops: true // CORREÇÃO: Nome correto da relação no schema.prisma
        }
    })

    if (!user) throw new Error("User not found")

    // Verifica se o usuário possui um perfil de Barbeiro vinculado
    const staffProfile = user.staffProfile

    const isAdmin = user.role === "ADMIN"
    const isBarber = !!staffProfile

    // 2. Definir a Barbearia alvo
    // CORREÇÃO: Acessando managedBarbershops em vez de barbershops
    const barbershopId = isAdmin
        ? user.managedBarbershops[0]?.id
        : staffProfile?.barbershopId

    if (!barbershopId) throw new Error("Unidade não encontrada")

    const now = new Date()
    const startMonth = startOfMonth(now)
    const endMonth = endOfMonth(now)

    // --- 1. DADOS DA LOJA (Geral) ---
    const shopBookings = await db.booking.findMany({
        where: { barbershopId, date: { gte: startMonth, lte: endMonth } },
        include: { service: true, user: true, staff: true }
    })

    const barbershop = await db.barbershop.findUnique({
        where: { id: barbershopId },
        select: { views: true, isClosed: true }
    })

    // --- 2. DADOS PESSOAIS (Se for barbeiro) ---
    let personalBookings: any[] = []
    if (isBarber) {
        personalBookings = await db.booking.findMany({
            where: { staffId: staffProfile!.id, date: { gte: startMonth, lte: endMonth } },
            include: { service: true, user: true }
        })
    }

    // Funções de Cálculo
    const calculateKpis = (bookingsList: any[]) => ({
        revenue: bookingsList.reduce((acc, b) => acc + Number(b.service.price), 0),
        bookings: bookingsList.length,
        today: bookingsList.filter(b => format(b.date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")).length
    })

    const calculateChart = (bookingsList: any[]) => {
        const days = eachDayOfInterval({ start: startMonth, end: endMonth })
        return days.map(day => ({
            date: format(day, "dd"),
            total: bookingsList
                .filter(b => format(b.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
                .reduce((acc, b) => acc + Number(b.service.price), 0)
        }))
    }

    return {
        role: user.role,
        isBarber,
        barberId: staffProfile?.id,
        kpi: {
            ...calculateKpis(shopBookings),
            views: barbershop?.views || 0,
            isClosed: barbershop?.isClosed || false
        },
        chartData: calculateChart(shopBookings),
        bookings: shopBookings.slice(0, 10).map(b => ({
            ...b,
            service: { ...b.service, price: Number(b.service.price) }
        })),

        personalKpi: isBarber ? { ...calculateKpis(personalBookings), isActive: user.staffProfile?.isActive ?? false } : null,
        personalChartData: isBarber ? calculateChart(personalBookings) : null,
        personalBookings: personalBookings.slice(0, 10).map(b => ({
            ...b,
            service: { ...b.service, price: Number(b.service.price) }
        }))
    }
}