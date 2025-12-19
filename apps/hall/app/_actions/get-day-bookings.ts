"use server"

import { db } from "@barbergo/database"
import { endOfDay, startOfDay } from "date-fns"

export const getDayBookings = async (barbershopId: string, date: Date, staffId?: string) => {
    const bookings = await db.booking.findMany({
        where: {
            barbershopId,
            date: {
                lte: endOfDay(date),
                gte: startOfDay(date),
            },
            // Se um staffId for passado, filtramos apenas os horários dele
            ...(staffId && { staffId }),
        },
        include: {
            service: true
        }
    })

    return bookings
}