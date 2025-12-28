"use server"

import { db } from "@barbergo/database"
import { authOptions } from "@/_lib/auth"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { hash } from "bcryptjs"
import { PLANS, PlanType } from "@barbergo/shared"

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

    // 0. VERIFICAÇÃO DE LIMITES DO PLANO
    const barbershop = await db.barbershop.findUnique({
        where: { id: params.barbershopId },
        select: {
            subscription: { select: { plan: true } }
        }
    })

    if (!barbershop?.subscription) return { error: "Erro: Assinatura não encontrada." }

    // Cast para garantir compatibilidade com o enum compartilhado
    const currentPlan = barbershop.subscription.plan as PlanType
    const planDetails = PLANS[currentPlan]

    // Se o plano não for encontrado (ex: dados antigos), fallback para BASIC
    const validPlan = planDetails || PLANS[PlanType.BASIC]

    const currentCount = await db.barberStaff.count({
        where: { barbershopId: params.barbershopId }
    })

    if (currentCount >= validPlan.maxProfessionals) {
        return {
            error: `Limite de profissionais do plano ${validPlan.name} atingido (${validPlan.maxProfessionals} profissionais). Faça upgrade para adicionar mais.`
        }
    }

    try {
        let targetUserId = params.userId
        let generatedPassword: string | null = null

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
                generatedPassword = tempPassword

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

        return { success: true, generatedPassword }
    } catch (error) {
        console.error(error)
        return { error: "Erro ao gerenciar equipe." }
    }
}

// VOU REESCREVER A FUNÇÃO INTEIRA PARA FICAR MAIS LIMPO E CAPTURAR A SENHA CORRETAMENTE

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