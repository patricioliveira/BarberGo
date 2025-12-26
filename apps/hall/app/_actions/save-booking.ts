"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"
import { addMinutes } from "date-fns"
import { Prisma } from "@prisma/client"

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
    // 1. Busca completa de integridade (Barbearia + Subscrição + Staff + Serviços + Bloqueio)
    const barbershop = await db.barbershop.findUnique({
        where: { id: barbershopId },
        include: {
            subscription: true,
            staff: { where: { id: staffId } },
            services: { where: { id: { in: serviceIds } } },
            blockedUsers: {
                where: { userId },
            },
        },
    })

    if (!barbershop) throw new Error("Barbearia não encontrada.")

    // 2. Validação de Cliente Bloqueado
    if (barbershop.blockedUsers.length > 0) {
        throw new Error("Você está bloqueado nesta barbearia e não pode realizar agendamentos.")
    }

    // 3. Validação de Status da Barbearia
    if (barbershop.isClosed) throw new Error("A barbearia está fechada no momento.")

    // 4. Validação de Subscrição (CRM)
    const subStatus = barbershop.subscription?.status
    if (subStatus === "SUSPENDED" || subStatus === "CANCELED") {
        throw new Error(
            "Agendamentos indisponíveis para esta unidade."
        )
    }

    // 5. Validação do Profissional
    const staff = barbershop.staff[0]
    if (!staff || !staff.isActive) {
        throw new Error("O profissional selecionado não está mais disponível.")
    }

    // 6. Validação dos Serviços
    if (barbershop.services.length !== serviceIds.length) {
        throw new Error("Um ou mais serviços selecionados não estão mais ativos.")
    }

    // Calcular duração total
    const totalDuration = barbershop.services.reduce(
        (acc, s) => acc + s.duration,
        0
    )
    const bookingStart = new Date(date)
    const bookingEnd = addMinutes(bookingStart, totalDuration)

    // 7. Transação com Isolamento Serializável para Concorrência
    // O nível Serializable garante que se duas transações tentarem ler e escrever
    // intervalos conflitantes simultaneamente, uma delas falhará.
    try {
        await db.$transaction(
            async (tx) => {
                const overlappingBooking = await tx.booking.findFirst({
                    where: {
                        staffId,
                        status: { not: "CANCELED" },
                        date: {
                            lt: bookingEnd,
                        },
                    },
                    include: { service: true },
                })

                if (overlappingBooking) {
                    const existingStart = new Date(overlappingBooking.date)
                    const existingEnd = addMinutes(
                        existingStart,
                        overlappingBooking.service.duration
                    )

                    if (
                        bookingStart < existingEnd &&
                        bookingEnd > existingStart
                    ) {
                        throw new Error(
                            "Este horário acabou de ser ocupado por outro cliente. Por favor, escolha outro."
                        )
                    }
                }

                // Criação dos agendamentos
                await Promise.all(
                    serviceIds.map((serviceId) =>
                        tx.booking.create({
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
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            }
        )
    } catch (error) {
        // Captura erro de serialização do Prisma
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2034"
        ) {
            throw new Error(
                "Houve um conflito ao tentar agendar. Por favor, tente novamente."
            )
        }
        throw error
    }

    revalidatePath("/")
    revalidatePath("/appointments")
}