"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"
import { addMinutes } from "date-fns"

interface SaveBookingParams {
    barbershopId: string
    serviceIds: string[]
    userId: string
    date: Date
    staffId: string
}

export const saveBooking = async ({
    barbershopId,
    serviceIds,
    userId,
    date,
    staffId,
}: SaveBookingParams) => {
    // 1. Busca completa de integridade (Barbearia + Subscrição + Staff + Serviços)
    const barbershop = await db.barbershop.findUnique({
        where: { id: barbershopId },
        include: {
            subscription: true,
            staff: { where: { id: staffId } },
            services: { where: { id: { in: serviceIds } } }
        }
    })

    if (!barbershop) throw new Error("Barbearia não encontrada.")

    // 2. Validação de Status da Barbearia
    if (barbershop.isClosed) throw new Error("A barbearia está fechada no momento.")

    // 3. Validação de Subscrição (CRM)
    const subStatus = barbershop.subscription?.status
    if (subStatus === "SUSPENDED" || subStatus === "CANCELED") {
        throw new Error("Agendamentos indisponíveis para esta unidade (Assinatura Suspensa).")
    }

    // 4. Validação do Profissional
    const staff = barbershop.staff[0]
    if (!staff || !staff.isActive) {
        throw new Error("O profissional selecionado não está mais disponível.")
    }

    // 5. Validação dos Serviços
    if (barbershop.services.length !== serviceIds.length) {
        throw new Error("Um ou mais serviços selecionados não estão mais ativos.")
    }

    // 6. Verificação de Concorrência (Overlap de Horário)
    const totalDuration = barbershop.services.reduce((acc, s) => acc + s.duration, 0)
    const bookingStart = new Date(date)
    const bookingEnd = addMinutes(bookingStart, totalDuration)

    const overlappingBooking = await db.booking.findFirst({
        where: {
            staffId,
            status: { not: "CANCELED" },
            date: {
                lt: bookingEnd, // Começa antes do meu fim
            },
            // A lógica de fim depende da duração do serviço já agendado
        },
        include: { service: true }
    })

    // Checagem manual de sobreposição considerando a duração do agendamento existente
    if (overlappingBooking) {
        const existingStart = new Date(overlappingBooking.date)
        const existingEnd = addMinutes(existingStart, overlappingBooking.service.duration)

        if (bookingStart < existingEnd && bookingEnd > existingStart) {
            throw new Error("Este horário acabou de ser ocupado por outro cliente. Por favor, escolha outro.")
        }
    }

    // 7. Persistência em Transação
    await db.$transaction(
        serviceIds.map((serviceId) =>
            db.booking.create({
                data: {
                    serviceId,
                    userId,
                    date,
                    barbershopId,
                    staffId,
                },
            })
        )
    )

    revalidatePath("/")
    revalidatePath("/appointments")
}