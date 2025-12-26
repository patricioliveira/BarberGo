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
    try {
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
            throw new Error(
                "Você está bloqueado nesta barbearia e não pode realizar agendamentos."
            )
        }

        // 3. Validação de Status da Barbearia
        if (barbershop.isClosed)
            throw new Error("A barbearia está fechada no momento.")

        // 4. Validação de Subscrição (CRM)
        const subStatus = barbershop.subscription?.status
        if (subStatus === "SUSPENDED" || subStatus === "CANCELED") {
            throw new Error("Agendamentos indisponíveis para esta unidade.")
        }

        // 5. Validação do Profissional
        const staff = barbershop.staff[0]
        if (!staff || !staff.isActive) {
            throw new Error(
                "O profissional selecionado não está mais disponível."
            )
        }

        // 6. Validação dos Serviços
        if (barbershop.services.length !== serviceIds.length) {
            throw new Error(
                "Um ou mais serviços selecionados não estão mais ativos."
            )
        }

        // Calcular duração total
        const totalDuration = barbershop.services.reduce(
            (acc, s) => acc + s.duration,
            0
        )
        const bookingStart = new Date(date)
        const bookingEnd = addMinutes(bookingStart, totalDuration)

        // 7. Transação com Isolamento Serializável e Locking Pessimista
        // O nível Serializable garante isolamento, mas o update dummy garante locking de linha
        // impedindo que duas transações leiam o estado "livre" ao mesmo tempo.
        await db.$transaction(
            async (tx) => {
                // LOCK: Força bloqueio de linha no Staff para serializar agendamentos neste profissional
                await tx.barberStaff.update({
                    where: { id: staffId },
                    data: { updatedAt: new Date() }, // Dummy update para travar a linha
                })

                // Define janela de busca (Dia inteiro do agendamento) para garantir cache/busca correta
                const dayStart = new Date(bookingStart)
                dayStart.setHours(0, 0, 0, 0)
                const dayEnd = new Date(bookingStart)
                dayEnd.setHours(23, 59, 59, 999)

                // Busca TODOS os agendamentos do dia para verificar colisão em memória
                const dayBookings = await tx.booking.findMany({
                    where: {
                        staffId,
                        status: { not: "CANCELED" },
                        date: {
                            gte: dayStart,
                            lte: dayEnd,
                        },
                    },
                    include: { service: true },
                })

                // Verificação de sobreposição precisa
                for (const existingBooking of dayBookings) {
                    const existingStart = new Date(existingBooking.date)
                    const existingEnd = addMinutes(
                        existingStart,
                        existingBooking.service.duration
                    )

                    // Fórmula de colisão de intervalos: (StartA < EndB) && (EndA > StartB)
                    if (
                        bookingStart < existingEnd &&
                        bookingEnd > existingStart
                    ) {
                        throw new Error(
                            "Este horário acabou de ser ocupado por outro cliente. Por favor, escolha outro."
                        )
                    }
                }

                // Criação dos agendamentos (se passou pela validação)
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
                isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // ReadCommitted é suficiente com o Row Lock explícito acima
                timeout: 10000, // 10s timeout para evitar deadlocks longos
            }
        )

        revalidatePath("/")
        revalidatePath("/appointments")

        return { success: true }
    } catch (error) {
        console.error("Erro ao salvar agendamento:", error)
        if (error instanceof Error) {
            return { success: false, message: error.message }
        }
        return {
            success: false,
            message: "Erro inesperado ao realizar o agendamento.",
        }
    }
}