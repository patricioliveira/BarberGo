"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export const createPartner = async (data: { name: string, email: string, percentage: number }) => {
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    await db.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: "PARTNER",
            commissionPercentage: data.percentage,
            isActive: true
        }
    })
    revalidatePath("/")
    return tempPassword
}

export const togglePartnerStatus = async (id: string, currentStatus: boolean) => {
    await db.user.update({
        where: { id },
        data: { isActive: !currentStatus }
    })
    revalidatePath("/")
}

export const deletePartner = async (id: string) => {
    await db.user.delete({ where: { id } })
    revalidatePath("/")
}