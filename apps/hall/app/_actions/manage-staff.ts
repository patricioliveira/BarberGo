"use server"

import { db } from "@barbergo/database"
import { authOptions } from "@/_lib/auth"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { hash } from "bcryptjs"

interface AddStaffParams {
    barbershopId: string
    name: string
    email: string
    jobTitle: string
    userId?: string // Usado quando o admin adiciona a si mesmo
}

export const addOrUpdateStaff = async (params: AddStaffParams) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { error: "Não autorizado" }

    try {
        let targetUserId = params.userId

        // 1. Lógica de Usuário (se não for o próprio admin)
        if (!targetUserId) {
            const existingUser = await db.user.findUnique({
                where: { email: params.email }
            })

            if (existingUser) {
                targetUserId = existingUser.id
                // Se o usuário já existe e é apenas cliente, promove a STAFF
                if (existingUser.role === "USER") {
                    await db.user.update({
                        where: { id: targetUserId },
                        data: { role: "STAFF" }
                    })
                }
            } else {
                // Cria novo usuário com senha aleatória
                const tempPassword = Math.random().toString(36).slice(-8) // Ex: a7k2m9p1
                const hashedPassword = await hash(tempPassword, 10)

                const newUser = await db.user.create({
                    data: {
                        name: params.name,
                        email: params.email,
                        password: hashedPassword,
                        role: "STAFF",
                    }
                })
                targetUserId = newUser.id

                // IMPORTANTE: Aqui você dispararia um e-mail com a 'tempPassword'
                console.log(`USUÁRIO CRIADO: ${params.email} | SENHA: ${tempPassword}`)
            }
        }

        // 2. Verifica se já é barbeiro nessa loja
        const alreadyStaff = await db.barberStaff.findFirst({
            where: { email: params.email, barbershopId: params.barbershopId }
        })

        if (alreadyStaff) return { error: "Este profissional já está cadastrado nesta unidade." }

        // 3. Cria o registro de BarberStaff
        await db.barberStaff.create({
            data: {
                name: params.name,
                email: params.email,
                jobTitle: params.jobTitle,
                barbershopId: params.barbershopId,
                userId: targetUserId,
                isActive: true
            }
        })

        revalidatePath("/admin/settings")
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: "Erro ao gerenciar equipe." }
    }
}

export const toggleStaffStatus = async (staffId: string, isActive: boolean) => {
    await db.barberStaff.update({
        where: { id: staffId },
        data: { isActive }
    })
    revalidatePath("/admin/settings")
}

export const deleteStaff = async (staffId: string) => {
    await db.barberStaff.delete({
        where: { id: staffId }
    })
    revalidatePath("/admin/settings")
}