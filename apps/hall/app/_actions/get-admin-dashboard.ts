"use server"

import { db } from "@barbergo/database"
import { startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const getAdminDashboard = async () => {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // 1. Identificar quem é o usuário
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { staffProfile: true }
    })

    if (!user) throw new Error("User not found")

    // 2. Definir o Contexto (Barbearia e Filtros)
    let barbershopId = ""
    let staffFilterId: string | undefined = undefined

    if (user.role === "ADMIN") {
        // Se for ADMIN, pega a barbearia que ele é dono
        // (Simplificado: pegando a primeira, num cenário real seria where: { ownerId: user.id })
        const shop = await db.barbershop.findFirst()
        if (!shop) throw new Error("Nenhuma barbearia vinculada")
        barbershopId = shop.id
        // Admin vê tudo, sem filtro de staffFilterId (a menos que ele selecione na UI)
    }
    else if (user.role === "STAFF") {
        // Se for STAFF, pega a barbearia do perfil dele e FORÇA o filtro
        if (!user.staffProfile) throw new Error("Perfil de funcionário não configurado")
        barbershopId = user.staffProfile.barbershopId
        staffFilterId = user.staffProfile.id // <--- O PULO DO GATO: Staff só vê o dele
    }
    else {
        throw new Error("Acesso negado")
    }

    // 3. Consultas ao Banco (Com os filtros aplicados)
    const now = new Date()
    const startMonth = startOfMonth(now)
    const endMonth = endOfMonth(now)

    // Condição de Busca Dinâmica
    const whereCondition: any = {
        barbershopId,
        date: { gte: startMonth, lte: endMonth },
        ...(staffFilterId && { staffId: staffFilterId }) // Aplica filtro se existir
    }

    const bookings = await db.booking.findMany({
        where: whereCondition,
        include: { service: true, user: true, staff: true },
        orderBy: { date: "desc" }
    })

    // Buscar dados da barbearia (apenas Admin vê views e status de fechamento)
    const barbershop = await db.barbershop.findUnique({
        where: { id: barbershopId },
        select: { views: true, isClosed: true }
    })

    // 4. Cálculos e Métricas
    const totalRevenue = bookings.reduce((acc, b) => acc + Number(b.service.price), 0)
    const totalBookings = bookings.length

    // Agendamentos de Hoje (Query separada para performance ou filtro JS simples)
    const todayBookings = bookings.filter(b => {
        const d = new Date(b.date)
        const n = new Date()
        return d.getDate() === n.getDate() && d.getMonth() === n.getMonth()
    })

    // Gráfico Diário
    const daysInMonth = eachDayOfInterval({ start: startMonth, end: endMonth })
    const chartData = daysInMonth.map(day => {
        const dayRevenue = bookings
            .filter(b => format(b.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
            .reduce((acc, b) => acc + Number(b.service.price), 0)
        return { date: format(day, "dd"), total: dayRevenue }
    })

    // Serialização
    const safeBookings = bookings.map(b => ({
        ...b,
        service: { ...b.service, price: Number(b.service.price) }
    }))

    return {
        role: user.role, // Retornamos a role para o Front decidir o que mostrar
        kpi: {
            revenue: totalRevenue,
            bookings: totalBookings,
            today: todayBookings.length,
            // Staff não vê views da loja, só Admin
            views: user.role === "ADMIN" ? (barbershop?.views || 0) : null,
            isClosed: barbershop?.isClosed || false
        },
        chartData,
        bookings: safeBookings
    }
}