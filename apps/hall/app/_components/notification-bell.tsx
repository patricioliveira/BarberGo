"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"

import { getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from "../_actions/notifications"
import { usePushNotifications } from "../_hooks/use-push-notifications"
import type { Notification } from "@barbergo/database"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuTrigger, Button, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@barbergo/ui"
import { useSession } from "next-auth/react"

// Extender o tipo para incluir a relação de booking
type NotificationWithBooking = Notification & {
    booking?: {
        staffId: string | null
    } | null
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationWithBooking[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const { subscribeToPush, subscription, isSupported, permission } = usePushNotifications()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'ALL' | 'ME'>('ALL')
    const { data: session } = useSession()

    const fetchNotifications = async () => {
        try {
            const [data, count] = await Promise.all([
                getNotifications(20), // Aumentei o limit para permitir filtragem client-side
                getUnreadCount()
            ])
            setNotifications(data)
            setUnreadCount(count)
        } catch (error) {
            console.error("Failed to fetch notifications", error)
        }
    }

    // Polling a cada 30 segundos
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    const filteredNotifications = notifications.filter(n => {
        // Staff vê apenas os seus próprios, a menos que seja admin
        if (session?.user?.role === 'STAFF') {
            return n.booking?.staffId === session?.user?.id
        }

        // Admin pode filtrar
        if (activeTab === 'ALL') return true
        return n.booking?.staffId === session?.user?.id
    })

    const handleMarkAsRead = async (notification: NotificationWithBooking) => {
        if (!notification.read) {
            // Otimisticamente atualiza UI
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n))

            await markNotificationAsRead(notification.id)
        }

        setIsOpen(false)

        // Roteamento Inteligente
        if (notification.type === 'NEW_BOOKING' || notification.link?.includes('admin')) {
            if (session?.user?.role === 'STAFF' || session?.user?.role === 'ADMIN') {
                router.push('/admin/my-schedule')
            } else {
                router.push('/admin')
            }
        } else if (notification.link) {
            router.push(notification.link)
        }
    }

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        await markAllNotificationsAsRead()
        toast.success("Todas marcadas como lidas")
    }

    const handleEnablePush = async () => {
        const toastId = toast.loading("Solicitando permissão...")
        const result = await subscribeToPush()

        if (result && result.success) {
            toast.success("Notificações ativadas com sucesso!", { id: toastId })
        } else {
            toast.error(result?.message || "Erro desconhecido", { id: toastId })
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (open) setUnreadCount(0)
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-600 border-2 border-background" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span>Notificações</span>
                        {unreadCount > 0 && (
                            <Button variant="ghost" className="text-xs h-6 px-2" onClick={handleMarkAllRead}>
                                Ler todas
                            </Button>
                        )}
                    </div>

                    {/* Context Switcher para quem é Admin e Staff */}
                    {session?.user?.role === 'ADMIN' && (
                        <div className="flex p-1 bg-muted/50 rounded-lg gap-1">
                            <Button
                                variant={activeTab === 'ALL' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="flex-1 h-7 text-xs"
                                onClick={() => setActiveTab('ALL')}
                            >
                                Barbearia
                            </Button>
                            <Button
                                variant={activeTab === 'ME' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="flex-1 h-7 text-xs"
                                onClick={() => setActiveTab('ME')}
                            >
                                Você
                            </Button>
                        </div>
                    )}
                </DropdownMenuLabel>

                {/* Status de Notificações Push */}
                {isSupported && (
                    <div className="p-2 bg-muted/50 text-xs text-center border-b">
                        {!subscription && permission === 'default' && (
                            <Button variant="outline" size="sm" className="w-full h-7 border-primary/20 text-primary hover:text-primary hover:bg-primary/10" onClick={handleEnablePush}>
                                Ativar Notificações Push
                            </Button>
                        )}

                        {!subscription && permission === 'granted' && (
                            <Button variant="outline" size="sm" className="w-full h-7 border-primary/20 text-primary hover:text-primary hover:bg-primary/10" onClick={handleEnablePush}>
                                Sincronizar Notificações Push
                            </Button>
                        )}

                        {subscription && (
                            <div className="text-green-500 font-medium flex items-center justify-center gap-1 py-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Notificações Push Ativas
                            </div>
                        )}

                        {permission === 'denied' && (
                            <div className="text-red-400 font-medium py-1">
                                Permissão de Push Negada
                            </div>
                        )}
                    </div>
                )}

                <DropdownMenuSeparator />

                <div className="max-h-[70vh] overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Nenhuma notificação {activeTab === 'ME' ? 'direta' : ''} encontrada
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.read ? "bg-muted/30 font-medium" : ""
                                    }`}
                                onClick={() => handleMarkAsRead(notification)}
                            >
                                <div className="flex justify-between w-full">
                                    <span className="text-sm font-semibold">{notification.title}</span>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                            addSuffix: true,
                                            locale: ptBR,
                                        })}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                </p>
                                {!notification.read && (
                                    <span className="block w-2 h-2 bg-blue-500 rounded-full mt-1 self-end" />
                                )}
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}