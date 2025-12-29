"use server"

import { db, NotificationType } from "@barbergo/database"
import { revalidatePath } from "next/cache"
import { sendNotification } from "../_lib/notifications"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Chamada pelo CLIENTE
export const requestCancellation = async (bookingId: string) => {
    const booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: { barbershop: true }
    })

    if (!booking) return

    const requireApproval = booking.barbershop.requireCancellationApproval

    await db.booking.update({
        where: { id: bookingId },
        data: { status: requireApproval ? "WAITING_CANCELLATION" : "CANCELED" }
    })

    // Notificar
    const dateFormatted = format(booking.date, "dd/MM 'às' HH:mm", { locale: ptBR })
    const title = requireApproval ? "Solicitação de Cancelamento" : "Cancelamento Realizado"
    const message = `${booking.barbershop.name}: Agendamento para ${dateFormatted} foi ${requireApproval ? "solicitado para cancelamento" : "cancelado"} pelo cliente.`

    // 1. Notifica Dono
    if (booking.barbershop.ownerId) {
        await sendNotification({
            recipientId: booking.barbershop.ownerId,
            title: title,
            message: message,
            type: NotificationType.CANCEL_REQUEST,
            link: "/admin/my-schedule",
            bookingId: booking.id
        })
    }

    // 2. Notifica Staff (se diferente do dono)
    if (booking.staffId && booking.staffId !== booking.barbershop.ownerId) {
        // Precisamos buscar o userId do staff. O booking tem staffId que é o ID da tabela BarberStaff.
        // Precisamos achar o User associado.
        const staff = await db.barberStaff.findUnique({
            where: { id: booking.staffId },
            select: { userId: true }
        })

        if (staff && staff.userId) {
            await sendNotification({
                recipientId: staff.userId,
                title: title,
                message: message,
                type: NotificationType.CANCEL_REQUEST,
                link: "/admin/my-schedule",
                bookingId: booking.id
            })
        }
    }

    revalidatePath("/appointments")
    revalidatePath("/admin")
    revalidatePath("/admin/my-schedule")
}

// Chamada pelo BARBEIRO (ADMIN)
export const handleCancellationDecision = async (bookingId: string, accept: boolean) => {
    const updatedBooking = await db.booking.update({
        where: { id: bookingId },
        data: { status: accept ? "CANCELED" : "CONFIRMED" },
        include: { service: true }
    })

    // Notificar Cliente
    const dateFormatted = format(updatedBooking.date, "dd/MM 'às' HH:mm", { locale: ptBR })
    await sendNotification({
        recipientId: updatedBooking.userId,
        title: accept ? "Cancelamento Confirmado" : "Cancelamento Recusado",
        message: `Sua solicitação de cancelamento para ${updatedBooking.service.name} em ${dateFormatted} foi ${accept ? "aceita" : "recusada"}.`,
        type: NotificationType.CANCEL_REQUEST,
        link: "/appointments",
        bookingId: updatedBooking.id
    })

    revalidatePath("/admin/my-schedule")
    revalidatePath("/admin")
    revalidatePath("/appointments")
}