"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"

interface SaveBookingParams {
    barbershopId: string
    serviceIds: string[]
    userId: string
    date: Date
    staffId: string // Adicionado para identificar o barbeiro no banco
}

export const saveBooking = async ({
    barbershopId,
    serviceIds,
    userId,
    date,
    staffId,
}: SaveBookingParams) => {
    // Cria todos os agendamentos vinculando ao barbeiro selecionado
    await db.$transaction(
        serviceIds.map((serviceId) =>
            db.booking.create({
                data: {
                    serviceId,
                    userId,
                    date,
                    barbershopId,
                    staffId, // Vincula o agendamento ao profissional
                },
            })
        )
    )

    revalidatePath("/")
    revalidatePath("/appointments")
}