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
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
            setPermission(Notification.permission)
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

        if (permission === 'denied') {
            return { success: false, message: "Permissão para notificações foi negada. Habilite nas configurações do navegador." }
        }

        if (permission === 'default') {
            const newPermission = await Notification.requestPermission()
            setPermission(newPermission)
            if (newPermission !== 'granted') {
                return { success: false, message: "Permissão negada pelo usuário." }
            }
        }

        try {
            // Race: Aguarda o SW estar pronto ou Timeout de 10s
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<ServiceWorkerRegistration>((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout: Service Worker não respondeu a tempo.")), 10000)
                )
            ])

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            })

            // Envia para o backend via Server Action
            const subJson = JSON.parse(JSON.stringify(sub))
            await subscribeUserToPush(subJson)

            setSubscription(sub)
            console.log('User subscribed to push')
            return { success: true }
        } catch (error: any) {
            console.error('Failed to subscribe to push:', error)

            // Mensagem amigável para Timeout
            if (error.message && error.message.includes('Timeout')) {
                return { success: false, message: "A conexão demorou um pouco. Tente novamente em instantes." }
            }

            return { success: false, message: "Não foi possível ativar agora. Tente recarregar a página." }
        }
    }

    return {
        isSupported,
        subscription,
        permission,
        subscribeToPush,
    }
}
