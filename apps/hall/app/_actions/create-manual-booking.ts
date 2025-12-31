"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

interface CreateManualBookingParams {
    serviceId: string
    staffId: string
    date: Date
    customerName: string
    customerPhone: string
    observation?: string
    userId?: string
}

export async function createManualBooking(data: CreateManualBookingParams) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { success: false, error: "Não autorizado" }

    try {
        // Validação básica
        if (!data.serviceId || !data.staffId || !data.date) {
            return { success: false, error: "Dados incompletos" }
        }

        const service = await db.barbershopService.findUnique({ where: { id: data.serviceId } })
        if (!service) return { success: false, error: "Serviço não encontrado" }

        // Verificar disponibilidade
        const end = new Date(data.date.getTime() + service.duration * 60000)

        const conflicts = await db.booking.findMany({
            where: {
                staffId: data.staffId,
                date: {
                    lt: end
                },
                AND: {
                    date: { // Start time of existing booking
                        // Note: Prisma doesn't support derived fields in where easily for duration.
                        // Ideally we check overlaps.
                        // Existing booking starts before New booking ends AND Ends after New booking starts
                        // Conflict: Existing.Start < New.End AND Existing.End > New.Start
                        // We can approximate by checking date range.
                        gte: new Date(data.date.getTime() - 120 * 60000) // Look back 2 hours
                    }
                },
                status: 'CONFIRMED'
            },
            include: {
                service: true
            }
        })

        // Precise conflict check in memory
        const hasConflict = conflicts.some(booking => {
            const bookingEnd = new Date(booking.date.getTime() + booking.service.duration * 60000)
            return booking.date < end && bookingEnd > data.date
        })

        if (hasConflict) {
            return { success: false, error: "Horário indisponível para este profissional" }
        }

        if (data.userId) {
            // Create for existing user
            await db.booking.create({
                data: {
                    barbershopId: service.barbershopId,
                    serviceId: data.serviceId,
                    staffId: data.staffId,
                    date: data.date,
                    userId: data.userId, // Must be provided
                    status: 'CONFIRMED',
                    observation: data.observation
                }
            })
        } else {
            // Create for walk-in / manual user
            await db.booking.create({
                data: {
                    barbershopId: service.barbershopId,
                    serviceId: data.serviceId,
                    staffId: data.staffId,
                    date: data.date,
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    status: 'CONFIRMED',
                    observation: data.observation
                    // userId is optional now
                }
            })
        }

        revalidatePath("/admin/my-schedule")
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao criar agendamento" }
    }
}
