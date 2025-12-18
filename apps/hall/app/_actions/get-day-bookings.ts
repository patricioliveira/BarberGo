"use server"

import { db } from "@barbergo/database"
import { endOfDay, startOfDay } from "date-fns"

export const getDayBookings = async (barbershopId: string, date: Date) => {
    const bookings = await db.booking.findMany({
        where: {
            barbershopId,
            date: {
                lte: endOfDay(date),
                gte: startOfDay(date),
            },
        },
        include: {
            service: true // Precisamos saber a duração do serviço agendado para calcular quando ele termina
        }
    })

    return bookings
}