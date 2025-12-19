"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"

// Chamada pelo CLIENTE
export const requestCancellation = async (bookingId: string) => {
    await db.booking.update({
        where: { id: bookingId },
        data: { status: "WAITING_CANCELLATION" }
    })
    revalidatePath("/appointments")
}

// Chamada pelo BARBEIRO (ADMIN)
export const handleCancellationDecision = async (bookingId: string, accept: boolean) => {
    await db.booking.update({
        where: { id: bookingId },
        data: { status: accept ? "CANCELED" : "CONFIRMED" }
    })
    revalidatePath("/admin/my-schedule")
}