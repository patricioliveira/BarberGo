"use server"

import { db } from "@barbergo/database"
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const getAdminDashboard = async (targetDate: Date = new Date(), period: "day" | "week" | "month" = "month") => {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const user = await db.user.findUnique({
        where: { id: (session.user as any).id },
        include: { staffProfile: true, managedBarbershops: true }
    })

    if (!user) throw new Error("User not found")

    const staffProfile = user.staffProfile
    const isAdmin = user.role === "ADMIN"
    const isBarber = !!staffProfile

    const barbershopId = isAdmin
        ? user.managedBarbershops[0]?.id
        : staffProfile?.barbershopId

    if (!barbershopId) throw new Error("Unidade não encontrada")

    const start = period === 'day' ? startOfDay(targetDate) :
        period === 'week' ? startOfWeek(targetDate, { weekStartsOn: 1 }) :
            startOfMonth(targetDate)

    const end = period === 'day' ? endOfDay(targetDate) :
        period === 'week' ? endOfWeek(targetDate, { weekStartsOn: 1 }) :
            endOfMonth(targetDate)

    // Data for KPIs and Charts (Selected Period)
    const shopBookings = await db.booking.findMany({
        where: { barbershopId, date: { gte: start, lte: end } },
        include: { service: true, user: true, staff: true },
        orderBy: { date: 'asc' }
    })

    // Data for "Próximos Clientes" (Always Next 5 from NOW, regardless of filter, IF viewing today/future context? 
    // User requested: "Próximos Clientes... limit 5... passed passed => finishes... show those of the day".
    // Let's implement independent queries for the "List" vs "Stats".
    // Actually, user said: "nessa tela... queria os filtros... e filtrar corretamente os dados".
    // But "Próximos Clientes" implies FUTURE. If I filter for last month, showing "Next Clients" is weird.
    // However, usually Dashboard Lists show the DATA of the selected period.
    // BUT the card is named "Próximos Clientes". 
    // Let's return a dedicated "nextAppointments" list that obeys the user's "Next 5" rule starting from NOW (or Target Date if it's the anchor).
    // If we strictly follow "Próximos Clientes", it should be from NOW.

    // Let's fetch the "List View" data separately.
    // Logic:
    // 1. If period is TODAY (or contains NOW), we want "Next 5 from NOW".
    // 2. If period is PAST, simply show bookings from that period (maybe all, or just limit 5 for UI consistency).
    // 3. User specifically asked: "No card Próximos Clientes... esta mostrando agendamentos de dias anteriores... só os que estão agendados".

    // We will return `bookings` specifically for the list view.
    // We'll filter `bookings` to be: date >= NOW (if filter is today/future) AND status != COMPLETED/CANCELED.

    const now = new Date()
    const viewDateIsPast = end < now

    let listBookingsQuery: any = {
        where: {
            barbershopId,
            status: { notIn: ["CANCELED"] }, // User wants to hide finalized
            date: { gte: viewDateIsPast ? start : now } // If viewing past, show range. If viewing present/future, show from NOW.
        },
        orderBy: { date: 'asc' },
        take: 10, // Limit slightly more than 5 to be safe
        include: { service: true, user: true, staff: true }
    }

    // If viewing a specific period (like a specific day in future), restrict to that period too?
    // User said: "mostrar os do dia".
    // So ensuring `lte: end` is important if narrowing down.
    if (!viewDateIsPast) {
        // If "Today", show from Now to End of Today (or unlimited future? User said "Próximos Clientes")
        // Usually "Próximos" means next upcoming.
        // But allow filtering by day.
        // If I select "Tomorrow", I want to see Tomorrow's bookings.
        // So: date >= Start AND date <= End.
        listBookingsQuery.where.date = { gte: start, lte: end }

        // Special case: If 'start' is in the past (e.g. Month view starting 1st, today is 15th), 
        // we only want bookings from NOW onwards?  "no conta, só os que estão agendados"
        if (start < now && end > now) {
            listBookingsQuery.where.date.gte = now
        }
    }

    const shopListBookings = await db.booking.findMany(listBookingsQuery)

    const viewsCount = await db.barbershopView.count({
        where: {
            barbershopId,
            date: { gte: start, lte: end }
        }
    })

    const barbershop = await db.barbershop.findUnique({
        where: { id: barbershopId },
        select: { isClosed: true, subscription: true },
    })

    let personalBookings: any[] = []
    let personalListBookings: any[] = []

    // ... (keep personal bookings logic)
    if (isBarber) {
        // Staff Stats (Selected Period)
        personalBookings = await db.booking.findMany({
            where: { staffId: staffProfile!.id, date: { gte: start, lte: end } },
            include: { service: true, user: true }
        })

        // Staff List (Filtered Logic)
        const personalListQuery = { ...listBookingsQuery }
        personalListQuery.where = { ...listBookingsQuery.where, staffId: staffProfile!.id }
        delete personalListQuery.where.barbershopId // Remove shop filter replacement

        personalListBookings = await db.booking.findMany(personalListQuery)
    }

    const filterActive = (list: any[]) => list.filter(b => b.status !== "CANCELED")

    const calculateKpis = (bookingsList: any[]) => {
        const activeBookings = filterActive(bookingsList)
        return {
            revenue: activeBookings.reduce((acc, b) => acc + Number(b.service.price), 0),
            bookings: activeBookings.length,
            today: activeBookings.filter(b => isToday(new Date(b.date))).length
        }
    }

    const calculateChart = (bookingsList: any[]) => {
        const activeBookings = filterActive(bookingsList)
        const days = eachDayOfInterval({ start: start, end: end })

        return days.map(day => ({
            date: format(day, "dd"),
            fullDate: day,
            total: activeBookings
                .filter(b => format(new Date(b.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
                .reduce((acc, b) => acc + Number(b.service.price), 0)
        }))
    }

    const shopViews = await db.barbershopView.findMany({
        where: {
            barbershopId,
            date: { gte: start, lte: end }
        }
    })

    const calculateViewsChart = () => {
        const days = eachDayOfInterval({ start: start, end: end })
        return days.map(day => ({
            date: format(day, "dd"),
            fullDate: day,
            total: shopViews.filter(v => format(new Date(v.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length
        }))
    }

    return {
        role: user.role,
        isBarber,
        subscription: barbershop?.subscription || null,
        barberId: staffProfile?.id,
        kpi: { ...calculateKpis(shopBookings), views: viewsCount, isClosed: barbershop?.isClosed || false },
        chartData: calculateChart(shopBookings),
        viewsChartData: calculateViewsChart(),
        shopViews: shopViews, // Exposing raw data for client-side hourly aggregation
        // Return refined list for the "Next Clients" card
        bookings: shopListBookings.map((b: any) => ({
            ...b, service: { ...b.service, price: Number(b.service.price) }
        })),
        personalKpi: isBarber ? { ...calculateKpis(personalBookings), isActive: user.staffProfile?.isActive ?? false } : null,
        personalChartData: isBarber ? calculateChart(personalBookings) : null,
        personalBookings: personalListBookings.map((b: any) => ({
            ...b, service: { ...b.service, price: Number(b.service.price) }
        }))
    }
}