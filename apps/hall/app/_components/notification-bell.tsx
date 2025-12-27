"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"

import { getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from "../_actions/notifications"
import { usePushNotifications } from "../_hooks/use-push-notifications"
import { Notification } from "@barbergo/database"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuTrigger, Button, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@barbergo/ui"

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const { subscribeToPush, subscription, isSupported } = usePushNotifications()
    const router = useRouter()

    const fetchNotifications = async () => {
        try {
            const [data, count] = await Promise.all([
                getNotifications(10), // Pega as ultimas 10
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

    const handleMarkAsRead = async (notification: Notification) => {
        if (!notification.read) {
            // Otimisticamente atualiza UI
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))

            await markNotificationAsRead(notification.id)
        }

        if (notification.link) {
            setIsOpen(false)
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
        const success = await subscribeToPush()
        if (success) {
            toast.success("Notificações ativadas com sucesso!")
        } else {
            toast.error("Erro ao ativar notificações. Verifique permissões.")
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-600 border-2 border-background" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notificações</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" className="text-xs h-6 px-2" onClick={handleMarkAllRead}>
                            Ler todas
                        </Button>
                    )}
                </DropdownMenuLabel>

                {isSupported && !subscription && (
                    <div className="p-2 bg-muted/50 text-xs text-center border-b">
                        <Button variant="outline" size="sm" className="w-full h-7" onClick={handleEnablePush}>
                            Ativar notificações no navegador
                        </Button>
                    </div>
                )}

                <DropdownMenuSeparator />

                <div className="max-h-[70vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Nenhuma notificação
                        </div>
                    ) : (
                        notifications.map((notification) => (
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