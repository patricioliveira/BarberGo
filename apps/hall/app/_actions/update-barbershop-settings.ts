"use server"

import { db } from "@barbergo/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

// Interface atualizada para os telefones
interface PhoneInput {
    number: string
    isWhatsapp: boolean
}

export const updateBarbershopSettings = async (params: {
    barbershopId: string
    storeData: {
        name: string
        address: string
        imageUrl: string
        phones: PhoneInput[] // Agora é um array de objetos
        paymentMethods: string[]
        isClosed: boolean
        instagram?: string
        amenities: string[]
    }
    hours: any[]
    services: any[]
    staff: any[]
}) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { error: "Não autorizado" }

    try {
        // Atualiza Barbearia
        await db.barbershop.update({
            where: { id: params.barbershopId },
            data: {
                name: params.storeData.name,
                address: params.storeData.address,
                imageUrl: params.storeData.imageUrl,
                phones: params.storeData.phones as unknown as Prisma.InputJsonValue,
                paymentMethods: params.storeData.paymentMethods,
                isClosed: params.storeData.isClosed,
                openingHours: params.hours as unknown as Prisma.InputJsonValue,
                instagram: params.storeData.instagram,
                amenities: params.storeData.amenities,
            },
        })

        // ... (Lógica de Serviços e Staff continua igual, mantenha o código existente aqui) ...
        // Apenas certifique-se de manter a lógica de criação/deleção de serviços e staff que já existia

        // Atualização de Serviços (Simplificado para o exemplo, mantenha o seu original)
        // ...

        revalidatePath("/")
        revalidatePath("/admin/settings")
        revalidatePath(`/barbershop/${params.barbershopId}`)

        return { success: true }
    } catch (error: any) {
        console.error(error)
        return { error: "Erro ao atualizar." }
    }
}