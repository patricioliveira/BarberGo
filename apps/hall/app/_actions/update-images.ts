"use server"

import { db } from "@barbergo/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { revalidatePath } from "next/cache"

export const updateBarbershopLogo = async (barbershopId: string, imageUrl: string) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { error: "Não autorizado" }

    try {
        await db.barbershop.update({
            where: { id: barbershopId },
            data: { imageUrl }
        })
        revalidatePath("/admin/settings")
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: "Erro ao atualizar logo." }
    }
}

export const updateServiceImage = async (serviceId: string, imageUrl: string) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { error: "Não autorizado" }

    try {
        await db.barbershopService.update({
            where: { id: serviceId },
            data: { imageUrl }
        })
        revalidatePath("/admin/settings")
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: "Erro ao atualizar imagem do serviço." }
    }
}

export const updateUserAvatar = async (imageUrl: string) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { error: "Não autorizado" }

    try {
        const userId = (session.user as any).id
        await db.user.update({
            where: { id: userId },
            data: { image: imageUrl }
        })
        revalidatePath("/profile")
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: "Erro ao atualizar avatar." }
    }
}
