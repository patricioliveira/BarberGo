"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"

// Salvar Avaliação
export const saveRating = async (params: {
    bookingId: string;
    barbershopId: string;
    stars: number;
    comment?: string;
}) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Não autorizado")

    await db.rating.create({
        data: {
            ...params,
            userId: (session.user as any).id,
        },
    })

    revalidatePath("/appointments")
    revalidatePath(`/barbershop/${params.barbershopId}`)
}

// Favoritar/Desfavoritar
export const toggleFavorite = async (barbershopId: string) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Não autorizado")
    const userId = (session.user as any).id

    const favorite = await db.favorite.findUnique({
        where: { userId_barbershopId: { userId, barbershopId } }
    })

    if (favorite) {
        await db.favorite.delete({ where: { id: favorite.id } })
    } else {
        await db.favorite.create({ data: { userId, barbershopId } })
    }

    revalidatePath("/")
    revalidatePath(`/barbershop/${barbershopId}`)
}

// Admin: Alterar visibilidade do comentário
export const toggleRatingVisibility = async (ratingId: string, show: boolean) => {
    await db.rating.update({
        where: { id: ratingId },
        data: { showOnPage: show }
    })
    revalidatePath("/admin/ratings")
}