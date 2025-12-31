"use server"

import { db } from "@barbergo/database"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"

export async function getReferrals() {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    // Get Admin's Barbershop
    const myshop = await db.barbershop.findFirst({
        where: { ownerId: session.user.id },
        select: { id: true, referralCode: true }
    })

    if (!myshop) throw new Error("BarberShop not found")

    // Get Referrals
    const referrals = await db.barbershop.findMany({
        where: { referredByBarbershopId: myshop.id },
        select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            referralRewardClaimed: true,
            subscription: {
                select: {
                    status: true,
                    plan: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    const pendingRewards = referrals.filter(r => !r.referralRewardClaimed && r.subscription?.status === 'ACTIVE').length

    return {
        referralCode: myshop.referralCode,
        referrals,
        stats: {
            total: referrals.length,
            pending: pendingRewards,
            redeemed: referrals.filter(r => r.referralRewardClaimed).length
        }
    }
}
