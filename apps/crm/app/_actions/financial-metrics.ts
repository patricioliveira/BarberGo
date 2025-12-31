"use server"

import { db } from "@barbergo/database"

export async function getSaaSMetrics() {
    // 1. Fetch all PAID invoices
    const paidInvoices = await db.invoice.findMany({
        where: { status: "PAID" },
        include: {
            subscription: {
                include: {
                    barbershop: {
                        include: {
                            referredBy: true // Partner
                        }
                    }
                }
            }
        }
    })

    // 2. Calculate Gross Revenue (Sum of amounts paid)
    const grossRevenue = paidInvoices.reduce((acc, inv) => acc + Number(inv.amount), 0)

    // 3. Calculate Total Discounts (Sum of discounts applied)
    const totalDiscounts = paidInvoices.reduce((acc, inv) => acc + Number(inv.discount || 0), 0)

    // 4. Calculate Commissions
    let totalCommissions = 0

    for (const invoice of paidInvoices) {
        const partner = invoice.subscription.barbershop.referredBy

        if (partner && partner.role === "PARTNER") { // Ensure it's a partner referral
            const commissionRate = Number(partner.commissionPercentage || 0) / 100
            const commissionAmount = Number(invoice.amount) * commissionRate
            totalCommissions += commissionAmount
        }
    }

    // 5. Net Revenue (Gross - Commissions)
    // Note: Discounts are already deducted from 'amount' usually, or 'amount' is final paid.
    // If 'amount' is what they paid, then Gross is what entered the bank.
    // Net = Gross - Commissions (Operational Cost).
    const netRevenue = grossRevenue - totalCommissions

    return {
        grossRevenue,
        netRevenue,
        totalDiscounts,
        totalCommissions
    }
}
