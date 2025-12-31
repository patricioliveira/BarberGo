"use server"

import { db } from "@barbergo/database"
import { Prisma } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { revalidatePath } from "next/cache"
import { compare, hash } from "bcryptjs"

interface UserPhone {
    number: string
    isWhatsApp: boolean
}

export const updateProfile = async (params: {
    name: string;
    email: string;
    image?: string; // Adicionado campo de imagem
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
                image: params.image, // Persiste a URL da imagem no banco
                UserPhone: params.phones as unknown as Prisma.InputJsonValue,
            },
        })

        // Revalida as páginas para que as alterações reflitam imediatamente
        revalidatePath("/")
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
            image: true, // Adicionado para retornar a URL da imagem atual
            UserPhone: true,
        }
    })
}

export const saveUserPhone = async (phones: UserPhone[]) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { error: "Não autorizado" }

    const userId = (session.user as any).id

    try {
        await db.user.update({
            where: { id: userId },
            data: {
                UserPhone: phones as unknown as Prisma.InputJsonValue,
            },
        })

        // Atualiza a sessão (Hack: Session update usually requires client side trigger or re-login, 
        // but this updates DB so next session fetch is correct)

        return { success: true }
    } catch (error) {
        console.error("Erro ao salvar telefone:", error)
        return { error: "Erro ao salvar telefone." }
    }
}