"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"

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
    revalidatePath("/appointments")
    revalidatePath("/admin")
    revalidatePath("/admin/my-schedule")
}

// Chamada pelo BARBEIRO (ADMIN)
export const handleCancellationDecision = async (bookingId: string, accept: boolean) => {
    await db.booking.update({
        where: { id: bookingId },
        data: { status: accept ? "CANCELED" : "CONFIRMED" }
    })
    revalidatePath("/admin/my-schedule")
    revalidatePath("/admin")
    revalidatePath("/appointments")
}