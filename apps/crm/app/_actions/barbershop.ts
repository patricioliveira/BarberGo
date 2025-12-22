"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export const createBarbershopWithDetails = async (data: {
    name: string,
    slug: string,
    address: string,
    ownerName: string,
    ownerEmail: string,
    plan: "PRO" | "PREMIUM",
    price: number,
    referredById?: string | null
}) => {
    // 1. Verificar se o parceiro está ativo (se houver um indicado)
    if (data.referredById) {
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

    // 4. Criar a Barbearia e a Assinatura
    const barbershop = await db.barbershop.create({
        data: {
            name: data.name,
            slug: data.slug.toLowerCase().replace(/\s+/g, '-'),
            address: data.address,
            imageUrl: "https://utfs.io/f/c97a2dc9-cf2a-468b-a351-bfad31dabc95-16p.png",
            description: "Unidade cadastrada via CRM Central",
            ownerId: user.id,
            referredById: data.referredById,
            isExclusive: data.plan === 'PREMIUM',
            subscription: {
                create: {
                    plan: data.plan,
                    price: data.price,
                    status: "TRIAL",
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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