"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"

interface SaveBookingParams {
    barbershopId: string
    serviceIds: string[] // Agora recebe um Array de IDs
    userId: string
    date: Date
}

export const saveBooking = async ({
    barbershopId,
    serviceIds,
    userId,
    date,
}: SaveBookingParams) => {
    // Cria todos os agendamentos em uma única transação
    await db.$transaction(
        serviceIds.map((serviceId) =>
            db.booking.create({
                data: {
                    serviceId,
                    userId,
                    date,
                    barbershopId,
                },
            })
        )
    )

    revalidatePath("/")
    revalidatePath("/appointments")
}