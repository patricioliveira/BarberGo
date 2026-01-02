"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { PlanType, BillingCycle } from "@barbergo/shared"

export const createBarbershopWithDetails = async (data: {
    name: string,
    slug: string,
    address: string,
    ownerName: string,
    ownerEmail: string,
    plan: PlanType,
    billingCycle: BillingCycle,
    price: number,
    referredById?: string | null,
    referralCode?: string | null,
    trialDays: number,
    billingType: "PREPAID" | "POSTPAID",
    isClosed: boolean
}) => {
    let referredByBarbershopId = null;

    // 0. Prioridade: Código de Indicação
    if (data.referralCode) {
        const referrerShop = await db.barbershop.findUnique({
            where: { referralCode: data.referralCode }
        })

        if (!referrerShop) {
            throw new Error("Código de indicação inválido.")
        }

        referredByBarbershopId = referrerShop.id;
        // Se tem código, ignora parceiro
        data.referredById = null;
    }
    // 1. Verificar se o parceiro está ativo (se houver um indicado e NÃO tiver código)
    else if (data.referredById) {
        const partner = await db.user.findUnique({
            where: { id: data.referredById },
            select: { isActive: true, name: true }
        })

        if (!partner) {
            throw new Error("Parceiro não encontrado.")
        }

        if (!partner.isActive) {
            throw new Error(`O parceiro ${partner.name} está inativo e não pode receber novas indicações.`)
        }
    }

    // 2. Verificar se o slug já existe
    const slugExists = await db.barbershop.findUnique({ where: { slug: data.slug } })
    if (slugExists) throw new Error("Este slug já está em uso.")

    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // 3. Criar ou atualizar o Usuário (Dono)
    const user = await db.user.upsert({
        where: { email: data.ownerEmail },
        update: { role: "ADMIN" },
        create: {
            name: data.ownerName,
            email: data.ownerEmail,
            password: hashedPassword,
            role: "ADMIN",
        }
    })

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + data.trialDays)

    // 4. Criar a Barbearia e a Assinatura
    const barbershop = await db.barbershop.create({
        data: {
            name: data.name,
            slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
            address: data.address,
            imageUrl: "",
            description: "",
            isClosed: true,
            ownerId: user.id,
            referredById: data.referredById,
            referredByBarbershopId: referredByBarbershopId,
            isExclusive: data.plan === PlanType.EXCLUSIVE,
            subscription: {
                create: {
                    plan: data.plan as any,
                    billingCycle: data.billingCycle,
                    price: data.price,
                    status: "TRIAL",
                    trialDays: data.trialDays,
                    billingType: data.billingType,
                    endDate: endDate
                }
            }
        }
    })

    revalidatePath("/")
    return { barbershop, tempPassword }
}

export const updateSubscriptionData = async (subscriptionId: string, data: any) => {
    await db.subscription.update({
        where: { id: subscriptionId },
        data
    })
    revalidatePath("/")
}