"use server"

import { db } from "@barbergo/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { hash, compare } from "bcryptjs"
import { revalidatePath } from "next/cache"

// Action para atualizar dados básicos
export const updateProfile = async (params: { name: string; email: string }) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { error: "Não autorizado" }

    const userId = (session.user as any).id

    try {
        await db.user.update({
            where: { id: userId },
            data: {
                name: params.name,
                email: params.email,
            },
        })

        revalidatePath("/admin/profile")
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') return { error: "Este e-mail já está em uso." }
        return { error: "Erro ao atualizar perfil." }
    }
}

// Action para alterar a senha
export const changePassword = async (params: { currentPass: string; newPass: string }) => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { error: "Não autorizado" }

    const userId = (session.user as any).id

    const user = await db.user.findUnique({ where: { id: userId } })

    // Se o usuário logou com Google, ele não tem senha no banco (password = null)
    if (!user?.password) {
        return { error: "Contas vinculadas ao Google não podem alterar senha por aqui." }
    }

    // Verifica se a senha atual está correta
    const passwordMatch = await compare(params.currentPass, user.password)
    if (!passwordMatch) {
        return { error: "A senha atual está incorreta." }
    }

    // Hasheia a nova senha e salva
    const hashedPassword = await hash(params.newPass, 10)
    await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    })

    return { success: true }
}