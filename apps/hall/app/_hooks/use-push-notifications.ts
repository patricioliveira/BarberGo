import { useEffect, useState } from 'react'
import { subscribeUserToPush } from '../_actions/notifications'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
        }
    }, [])

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            })

            const sub = await registration.pushManager.getSubscription()
            setSubscription(sub)
        } catch (error) {
            console.error('Service Worker registration failed:', error)
        }
    }

    async function subscribeToPush(): Promise<{ success: boolean; message?: string }> {
        if (!isSupported) {
            return { success: false, message: "Notificações não suportadas neste navegador." }
        }

        if (!VAPID_PUBLIC_KEY) {
            console.error("VAPID Key is missing in environment variables")
            return { success: false, message: "Erro de configuração: Chave VAPID ausente." }
        }

        if (Notification.permission === 'denied') {
            return { success: false, message: "Permissão para notificações foi negada." }
        }

        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            })

            // Envia para o backend via Server Action
            // Precisamos serializar o subscription para passar para a server action
            const subJson = JSON.parse(JSON.stringify(sub))
            await subscribeUserToPush(subJson)

            setSubscription(sub)
            console.log('User subscribed to push')
            return { success: true }
        } catch (error) {
            console.error('Failed to subscribe to push:', error)
            return { success: false, message: "Erro ao ativar notificações. Tente novamente." }
        }
    }

    return {
        isSupported,
        subscription,
        subscribeToPush,
    }
}
