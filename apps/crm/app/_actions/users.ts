"use server"

import { db } from "@barbergo/database"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export const generateMasterPassword = async (userId: string) => {
    // 1. Generate random 6-digit code
    const rawPassword = Math.floor(100000 + Math.random() * 900000).toString()

    // 2. Hash it
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    // 3. Set expiration (e.g., 2 hours)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 2)

    // 4. Save to DB
    await db.user.update({
        where: { id: userId },
        data: {
            masterPassword: hashedPassword,
            masterPasswordExpiresAt: expiresAt
        }
    })

    revalidatePath("/barbershop/[id]")

    return { rawPassword, expiresAt }
}
