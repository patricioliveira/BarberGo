"use server"

import { db } from "@barbergo/database"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { revalidatePath } from "next/cache"

const DEFAULT_HOURS = [
    { day: "Segunda-feira", open: "09:00", close: "19:00", isOpen: true },
    { day: "Terça-feira", open: "09:00", close: "19:00", isOpen: true },
    { day: "Quarta-feira", open: "09:00", close: "19:00", isOpen: true },
    { day: "Quinta-feira", open: "09:00", close: "19:00", isOpen: true },
    { day: "Sexta-feira", open: "09:00", close: "19:00", isOpen: true },
    { day: "Sábado", open: "09:00", close: "15:00", isOpen: false },
    { day: "Domingo", open: "00:00", close: "00:00", isOpen: false },
]

export const getStaffHoursData = async () => {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const staff = await db.barberStaff.findFirst({
        where: { userId: (session.user as any).id },
        include: { barbershop: { select: { openingHours: true, name: true } } }
    })

    if (!staff) throw new Error("Perfil de funcionário não encontrado.")

    // 1. Pega o da barbearia ou o padrão global
    const shopHours = (staff.barbershop.openingHours as any[]) || DEFAULT_HOURS

    // 2. Verifica se o do staff existe e se tem conteúdo (não apenas [])
    const rawStaffHours = staff.openingHours as any[]
    const hasHours = rawStaffHours && rawStaffHours.length > 0

    const staffHours = hasHours ? rawStaffHours : shopHours

    return {
        staffHours,
        shopHours,
        shopName: staff.barbershop.name,
        staffId: staff.id
    }
}

export const updateStaffHours = async (staffId: string, hours: any) => {
    await db.barberStaff.update({
        where: { id: staffId },
        data: { openingHours: hours }
    })
    revalidatePath("/admin/my-hours")
    return { success: true }
}