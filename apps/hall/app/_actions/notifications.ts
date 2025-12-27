'use server'

import { db } from '@barbergo/database'
import { authOptions } from '../_lib/auth'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

export async function subscribeUserToPush(subscription: any) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // Verificar se já existe
    const existing = await db.pushSubscription.findUnique({
        where: { endpoint: subscription.endpoint },
    })

    if (existing) {
        if (existing.userId !== session.user.id) {
            // Atualizar user se mudou (embora endpoint geralmente seja unico por browser profile)
            await db.pushSubscription.update({
                where: { id: existing.id },
                data: { userId: session.user.id }
            })
        }
        return { success: true }
    }

    await db.pushSubscription.create({
        data: {
            userId: session.user.id,
            endpoint: subscription.endpoint,
            keys: subscription.keys,
        },
    })

    return { success: true }
}

export async function getNotifications(limit = 10) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return []
    }

    return await db.notification.findMany({
        where: { recipientId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
    })
}

export async function getUnreadCount() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return 0
    }

    return await db.notification.count({
        where: {
            recipientId: session.user.id,
            read: false
        },
    })
}

export async function markNotificationAsRead(notificationId: string) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    await db.notification.update({
        where: {
            id: notificationId,
            recipientId: session.user.id, // Garante que só o dono pode marcar
        },
        data: { read: true },
    })

    revalidatePath('/admin') // Ou caminho mais específico
}

export async function markAllNotificationsAsRead() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    await db.notification.updateMany({
        where: {
            recipientId: session.user.id,
            read: false
        },
        data: { read: true },
    })

    revalidatePath('/admin')
}
