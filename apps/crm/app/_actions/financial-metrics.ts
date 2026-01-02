"use server"

import { db } from "@barbergo/database"

export async function getSaaSMetrics() {
    // 1. Receita Bruta (Faturas Pagas)
    const paidInvoices = await db.invoice.findMany({
        where: { status: "PAID" }
    })

    const grossRevenue = paidInvoices.reduce((acc, inv) => acc + Number(inv.amount), 0)

    // 2. Descontos Aplicados
    const totalDiscounts = paidInvoices.reduce((acc, inv) => acc + Number(inv.discount || 0), 0)

    // 3. Comissões Pagas (Já liquidadas)
    const paidCommissions = await db.commissionPayout.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true }
    })
    const totalPaidCommissions = Number(paidCommissions._sum.amount || 0)

    // 4. Passivo Futuro (Comissões Agendadas/Pendentes)
    const pendingCommissions = await db.commissionPayout.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true }
    })
    const futureLiability = Number(pendingCommissions._sum.amount || 0)

    // 5. Receita Líquida Real (Gross - PaidCommissions - Liability)
    // Considerando que Liability é dívida certa a menos que cancelem, para gestão conservadora deduzimos tudo.
    const netRevenue = grossRevenue - totalPaidCommissions - futureLiability

    // 6. Total Comissões (Pagas + Pendentes)
    const totalCommissions = totalPaidCommissions + futureLiability

    return {
        grossRevenue,
        totalDiscounts,
        totalPaidCommissions,
        futureLiability,
        netRevenue,
        totalCommissions
    }
}
