"use server"

import { db } from "@barbergo/database" // Certifique-se que o Prisma está exportado aqui
import { Prisma } from "@prisma/client" // Importamos o namespace Prisma para tipagem
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { revalidatePath } from "next/cache"
import { compare, hash } from "bcryptjs"

// 1. Definimos a interface para uso no Frontend
interface UserPhone {
    number: string
    isWhatsApp: boolean
}

export const updateProfile = async (params: {
    name: string;
    email: string;
    phones: UserPhone[]
}) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { error: "Não autorizado" }

    const userId = (session.user as any).id

    try {
        await db.user.update({
            where: { id: userId },
            data: {
                name: params.name,
                email: params.email,
                // CORREÇÃO: Usamos 'as Prisma.InputJsonValue' para satisfazer o TypeScript do Prisma
                UserPhone: params.phones as unknown as Prisma.InputJsonValue,
            },
        })

        // Revalida as páginas para limpar o cache
        revalidatePath("/profile")
        revalidatePath("/admin")

        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') return { error: "Este e-mail já está em uso." }
        console.error("Erro ao atualizar perfil:", error)
        return { error: "Erro ao atualizar perfil." }
    }
}

export const changePassword = async (params: { currentPass: string; newPass: string }) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { error: "Não autorizado" }

    const userId = (session.user as any).id

    const user = await db.user.findUnique({ where: { id: userId } })

    if (!user?.password) {
        return { error: "Contas vinculadas ao Google não podem alterar senha por aqui." }
    }

    const passwordMatch = await compare(params.currentPass, user.password)
    if (!passwordMatch) {
        return { error: "A senha atual está incorreta." }
    }

    const hashedPassword = await hash(params.newPass, 10)
    await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    })

    return { success: true }
}

export const getUserProfile = async () => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return null

    return await db.user.findUnique({
        where: { id: (session.user as any).id },
        select: {
            name: true,
            email: true,
            UserPhone: true, // O campo do seu schema
        }
    })
}