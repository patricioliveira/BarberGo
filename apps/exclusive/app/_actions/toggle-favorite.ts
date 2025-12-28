"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"

interface ToggleFavoriteParams {
    userId: string
    barbershopId: string
}

export const toggleFavorite = async ({
    userId,
    barbershopId,
}: ToggleFavoriteParams) => {
    try {
        const existingFavorite = await db.favorite.findUnique({
            where: {
                userId_barbershopId: {
                    userId,
                    barbershopId,
                },
            },
        })

        if (existingFavorite) {
            await db.favorite.delete({
                where: {
                    id: existingFavorite.id,
                },
            })
        } else {
            await db.favorite.create({
                data: {
                    userId,
                    barbershopId,
                },
            })
        }

        revalidatePath("/")
        revalidatePath("/barbershop/[id]")
        revalidatePath("/favorites") // Caso exista página de favoritos separada

        return { success: true }
    } catch (error) {
        console.error("Erro ao favoritar:", error)
        return { success: false }
    }
}
