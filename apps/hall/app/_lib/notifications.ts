import 'server-only'
import webpush from 'web-push'
import { db, NotificationType } from '@barbergo/database'

// Configura o web-push com as chaves VAPID
// As chaves devem estar no .env
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        `mailto:suporte@barbergo.com`,
        vapidPublicKey,
        vapidPrivateKey
    )
} else {
    console.warn('VAPID keys not found. Web Push notifications will not work.')
}

interface SendNotificationParams {
    recipientId: string
    title: string
    message: string
    type: NotificationType
    link?: string
    bookingId?: string
}

export async function sendNotification({
    recipientId,
    title,
    message,
    type,
    link,
    bookingId,
}: SendNotificationParams) {
    try {
        // 1. Salvar no banco de dados (Sininho)
        const notification = await db.notification.create({
            data: {
                recipientId,
                title,
                message,
                type,
                link,
                bookingId,
                read: false,
            },
        })

        // 2. Buscar subscriptions do usuário para envio do Push
        const subscriptions = await db.pushSubscription.findMany({
            where: { userId: recipientId },
        })

        if (subscriptions.length === 0) {
            return { success: true, notification, pushSent: 0 }
        }

        // 3. Enviar Push para todas as subscriptions
        const payload = JSON.stringify({
            title,
            body: message,
            icon: '/icon-192x192.png', // Ajustar caminho do ícone se necessário
            url: link ? `${appUrl}${link}` : appUrl, // Link completo
            data: {
                url: link ? `${appUrl}${link}` : appUrl,
                notificationId: notification.id
            }
        })

        const promises = subscriptions.map((sub: any) => {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: sub.keys as any, // @types/web-push espera { auth: string; p256dh: string }
            }

            return webpush.sendNotification(pushConfig, payload).catch(async (err: any) => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription expirada ou inválida, remover do banco
                    console.log(`Removing expired subscription for user ${recipientId}`)
                    await db.pushSubscription.delete({ where: { id: sub.id } })
                } else {
                    console.error('Error sending push notification:', err)
                }
            })
        })

        await Promise.all(promises)

        return { success: true, notification, pushSent: subscriptions.length }
    } catch (error) {
        console.error('Error in sendNotification:', error)
        // Não queremos quebrar o fluxo principal se a notificação falhar, mas podemos logar
        return { success: false, error }
    }
}
