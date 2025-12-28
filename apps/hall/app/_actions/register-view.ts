"use server"

import { db } from "@barbergo/database"
import { cookies, headers } from "next/headers"
import { isToday } from "date-fns"

export const registerView = async (barbershopId: string) => {
    try {
        const headerStore = headers()
        const host = headerStore.get("host")

        // Restringe contagem apenas para produção (domínio oficial)
        // Ignora localhost, vercel.app, ips diretos, etc.
        if (!host || !host.includes("barbergo.online")) {
            return { success: false, reason: "Domain ignored" }
        }

        const cookieStore = cookies()
        const viewCookieName = `view_${barbershopId}`
        const lastView = cookieStore.get(viewCookieName)?.value


        // Se já tiver um cookie de view para essa barbearia Hoje, ignora
        if (lastView) {
            const lastViewDate = new Date(lastView)
            if (isToday(lastViewDate)) {
                return { success: false, reason: "Already viewed today" }
            }
        }

        // Registra a View no banco (Tabela de Historico)
        await db.barbershopView.create({
            data: {
                barbershopId,
                date: new Date()
            }
        })

        // Atualiza contador total na Barbearia (Legado/Cache rápido)
        await db.barbershop.update({
            where: { id: barbershopId },
            data: { views: { increment: 1 } }
        })

        // Define cookie indicando que viu hoje (expira em 24h ou final do dia seria melhor, mas 24h é simples)
        // Usando set no server action
        // Nota: Server Actions em Client Components não podem setar cookies diretamente no return se forem chamados via useEffect sem transição?
        // Sim, mas cookies().set funciona em Server Actions chamadas do cliente.
        cookieStore.set(viewCookieName, new Date().toISOString(), {
            maxAge: 60 * 60 * 24, // 24 horas
            path: "/",
            httpOnly: true // Não acessível via JS client, mas server lê
        })

        return { success: true }
    } catch (error) {
        console.error("Erro ao registrar view:", error)
        return { error: "Erro interno" }
    }
}
