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
    price: number
}) => {
    // 1. Verificar se o slug já existe
    const slugExists = await db.barbershop.findUnique({ where: { slug: data.slug } })
    if (slugExists) throw new Error("Este slug já está em uso.")

    // 2. Gerar senha aleatória de 8 caracteres
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // 3. Criar ou atualizar o Usuário (Dono)
    // O NextAuth associa automaticamente se o e-mail for o mesmo no login do Google
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
            imageUrl: "https://utfs.io/f/c97a2dc9-cf2a-468b-a351-bfad31dabc95-16p.png", // Placeholder
            description: "Unidade cadastrada via CRM Central",
            ownerId: user.id,
            isExclusive: data.plan === 'PREMIUM',
            subscription: {
                create: {
                    plan: data.plan,
                    price: data.price,
                    status: "TRIAL",
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias de trial
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