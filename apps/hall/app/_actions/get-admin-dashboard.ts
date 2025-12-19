"use server"

import { db } from "@barbergo/database"
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isToday } from "date-fns"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const getAdminDashboard = async () => {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const user = await db.user.findUnique({
        where: { id: (session.user as any).id },
        include: {
            staffProfile: true,
            managedBarbershops: true
        }
    })

    if (!user) throw new Error("User not found")

    const staffProfile = user.staffProfile
    const isAdmin = user.role === "ADMIN"
    const isBarber = !!staffProfile

    const barbershopId = isAdmin
        ? user.managedBarbershops[0]?.id
        : staffProfile?.barbershopId

    if (!barbershopId) throw new Error("Unidade não encontrada")

    const now = new Date()
    const startMonth = startOfMonth(now)
    const endMonth = endOfMonth(now)

    // --- 1. BUSCA DE DADOS ---
    const shopBookings = await db.booking.findMany({
        where: { barbershopId, date: { gte: startMonth, lte: endMonth } },
        include: { service: true, user: true, staff: true }
    })

    const barbershop = await db.barbershop.findUnique({
        where: { id: barbershopId },
        select: { views: true, isClosed: true }
    })

    let personalBookings: any[] = []
    if (isBarber) {
        personalBookings = await db.booking.findMany({
            where: { staffId: staffProfile!.id, date: { gte: startMonth, lte: endMonth } },
            include: { service: true, user: true }
        })
    }

    // --- 2. FUNÇÕES DE CÁLCULO FILTRADAS ---

    // Filtra agendamentos que NÃO estão cancelados para fins de estatísticas financeiras e contagem
    const filterActive = (list: any[]) => list.filter(b => b.status !== "CANCELED")

    const calculateKpis = (bookingsList: any[]) => {
        const activeBookings = filterActive(bookingsList)

        return {
            // Soma apenas o que não foi cancelado
            revenue: activeBookings.reduce((acc, b) => acc + Number(b.service.price), 0),
            // Conta apenas o que não foi cancelado
            bookings: activeBookings.length,
            // Agendamentos ativos de hoje
            today: activeBookings.filter(b => isToday(new Date(b.date))).length
        }
    }

    const calculateChart = (bookingsList: any[]) => {
        const activeBookings = filterActive(bookingsList)
        const days = eachDayOfInterval({ start: startMonth, end: endMonth })

        return days.map(day => ({
            date: format(day, "dd"),
            total: activeBookings
                .filter(b => format(b.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
                .reduce((acc, b) => acc + Number(b.service.price), 0)
        }))
    }

    // --- 3. RETORNO DOS DADOS ---
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
        // Mantemos a lista completa (inclusive cancelados) para o admin poder ver no histórico se necessário, 
        // ou você pode filtrar aqui também usando .filter(b => b.status !== "CANCELED")
        bookings: shopBookings.slice(0, 10).map(b => ({
            ...b,
            service: { ...b.service, price: Number(b.service.price) }
        })),

        personalKpi: isBarber ? {
            ...calculateKpis(personalBookings),
            isActive: user.staffProfile?.isActive ?? false
        } : null,

        personalChartData: isBarber ? calculateChart(personalBookings) : null,

        personalBookings: personalBookings.map(b => ({
            ...b,
            service: { ...b.service, price: Number(b.service.price) }
        }))
    }
}