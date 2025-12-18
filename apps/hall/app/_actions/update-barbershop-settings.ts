"use server"

import { authOptions } from "@/_lib/auth"
import { db } from "@barbergo/database"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"

interface ServiceInput {
    id?: string
    name: string
    description: string
    price: string
    duration: number
}

interface StaffInput {
    id?: string
    name: string
    email: string
    jobTitle: string
}

interface UpdateSettingsParams {
    barbershopId: string
    storeData: {
        name: string
        address: string
        phones: string[]
        paymentMethods: string[]
        isClosed: boolean
    }
    hours: any
    services: ServiceInput[]
    staff: StaffInput[]
}

export const updateBarbershopSettings = async (params: UpdateSettingsParams) => {
    const session = await getServerSession(authOptions)

    if (!session?.user) return { error: "Não autorizado" }

    try {
        await db.$transaction(async (tx: { barbershop: { update: (arg0: { where: { id: string }; data: { name: string; address: string; phones: string[]; paymentMethods: string[]; isClosed: boolean; openingHours: any } }) => any }; barbershopService: { deleteMany: (arg0: { where: { barbershopId: string; id: { notIn: string[] } } }) => any; create: (arg0: { data: { id: undefined; price: string; barbershopId: string; imageUrl: string; name: string; description: string; duration: number } }) => any; update: (arg0: { where: { id: string | undefined }; data: { name: string; description: string; price: string; duration: number } }) => any }; barberStaff: { deleteMany: (arg0: { where: { barbershopId: string; id: { notIn: string[] } } }) => any; create: (arg0: { data: { id: undefined; barbershopId: string; name: string; email: string; jobTitle: string } }) => any; update: (arg0: { where: { id: string | undefined }; data: { name: string; email: string; jobTitle: string } }) => any } }) => {
            // 1. Dados Básicos e Horários
            await tx.barbershop.update({
                where: { id: params.barbershopId },
                data: {
                    name: params.storeData.name,
                    address: params.storeData.address,
                    phones: params.storeData.phones,
                    paymentMethods: params.storeData.paymentMethods,
                    isClosed: params.storeData.isClosed,
                    openingHours: params.hours,
                },
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
                        data: { ...s, id: undefined, price: s.price, barbershopId: params.barbershopId, imageUrl: "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6d4116-16g.png" }
                    })
                } else {
                    await tx.barbershopService.update({ where: { id: s.id }, data: { name: s.name, description: s.description, price: s.price, duration: s.duration } })
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
                    await tx.barberStaff.update({ where: { id: st.id }, data: { name: st.name, email: st.email, jobTitle: st.jobTitle } })
                }
            }
        })

        revalidatePath("/admin/settings")
        return { success: true }
    } catch (error) {
        return { error: "Erro ao salvar no banco de dados." }
    }
}