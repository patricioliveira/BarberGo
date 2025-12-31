"use server"

import { db } from "@barbergo/database"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export const getBarbershopSubscription = async () => {
    const session = await getServerSession(authOptions)
    if (!session?.user) return null

    const user = await db.user.findUnique({
        where: { id: (session.user as any).id },
        include: {
            managedBarbershops: {
                include: {
                    subscription: {
                        include: {
                            invoices: {
                                orderBy: { createdAt: 'desc' },
                                include: { referralRewardSource: true }
                            }
                        }
                    }
                }
            }
        }
    })

    return user?.managedBarbershops[0]?.subscription || null
}

export const getSubscriptionWithHistory = async (barbershopId: string) => {
    return await db.subscription.findUnique({
        where: { barbershopId },
        include: {
            invoices: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })
}