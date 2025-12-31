import { db } from "@barbergo/database"
import { hash } from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const { name, email, password, phones } = await req.json()

        if (!email || !password || !name) {
            return new NextResponse("Dados inválidos", { status: 400 })
        }

        if (!phones || !Array.isArray(phones) || phones.length === 0) {
            return new NextResponse("Telefone obrigatório", { status: 400 })
        }

        const userExists = await db.user.findUnique({
            where: { email },
        })

        if (userExists) {
            return new NextResponse("Usuário já existe", { status: 409 })
        }

        const hashedPassword = await hash(password, 12)

        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                UserPhone: phones,
            },
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("[REGISTER_ERROR]", error)
        return new NextResponse("Erro interno", { status: 500 })
    }
}