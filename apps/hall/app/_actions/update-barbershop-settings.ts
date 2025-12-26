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
        allowOvertime: boolean
    }
    hours: any[]
    services: any[]
    staff: any[]
}) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { error: "Não autorizado" }

    try {
        await db.$transaction(async (tx) => {
            // 1. Atualiza Barbearia
            await tx.barbershop.update({
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
                    allowOvertime: params.storeData.allowOvertime,
                } as any,
            })

            // 2. Sincronização de Serviços
            const serviceIdsToKeep = params.services.filter(s => s.id && s.id.length > 15).map(s => s.id!)
            await tx.barbershopService.deleteMany({
                where: { barbershopId: params.barbershopId, id: { notIn: serviceIdsToKeep } }
            })

            for (const s of params.services) {
                const isNew = !s.id || s.id.length < 15
                if (isNew) {
                    await tx.barbershopService.create({
                        data: { ...s, id: undefined, price: s.price, barbershopId: params.barbershopId, imageUrl: s.imageUrl || "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6d4116-16g.png" }
                    })
                } else {
                    await tx.barbershopService.update({ where: { id: s.id }, data: { name: s.name, description: s.description, price: s.price, duration: s.duration, imageUrl: s.imageUrl } })
                }
            }

            // 3. Sincronização de Equipe
            const staffIdsToKeep = params.staff.filter(st => st.id && st.id.length > 15).map(st => st.id!)
            await tx.barberStaff.deleteMany({
                where: { barbershopId: params.barbershopId, id: { notIn: staffIdsToKeep } }
            })

            for (const st of params.staff) {
                const isNew = !st.id || st.id.length < 15
                if (isNew) {
                    await tx.barberStaff.create({ data: { ...st, id: undefined, barbershopId: params.barbershopId } })
                } else {
                    await tx.barberStaff.update({ where: { id: st.id }, data: { name: st.name, email: st.email, jobTitle: st.jobTitle, isActive: st.isActive } })
                }
            }
        })

        revalidatePath("/")
        revalidatePath("/admin/settings")
        revalidatePath(`/barbershop/${params.barbershopId}`)

        return { success: true }
    } catch (error: any) {
        console.error(error)
        return { error: "Erro ao atualizar." }
    }
}