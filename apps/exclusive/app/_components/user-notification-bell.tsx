"use client"

import { useState, useEffect, useMemo } from "react"
import { Bell, CalendarCheck, XCircle, Timer, Clock } from "lucide-react"
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@barbergo/ui"
import { format, differenceInMinutes, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { getUserNotifications } from "@/_actions/get-user-notifications"
import { usePushNotifications } from "../_hooks/use-push-notifications"
import { toast } from "sonner"

export default function UserNotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [now, setNow] = useState(new Date())
    const { subscribeToPush, subscription, isSupported, permission } = usePushNotifications()

    const handleEnablePush = async () => {
        const toastId = toast.loading("Solicitando permissão...")
        const result = await subscribeToPush()

        if (result && result.success) {
            toast.success("Notificações ativadas com sucesso!", { id: toastId })
        } else {
            toast.error(result?.message || "Erro desconhecido", { id: toastId })
        }
    }

    useEffect(() => {
        const load = async () => {
            const data = await getUserNotifications()
            setNotifications(data)
        }
        load()
        const timer = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const enrichedNotifications = useMemo(() => {
        return notifications.map(n => {
            const diff = differenceInMinutes(new Date(n.date), now)
            const isReminder = n.status === "CONFIRMED" && isToday(new Date(n.date)) && diff > 0 && diff <= 15

            return {
                ...n,
                isReminder,
                displayText: isReminder
                    ? `Faltam ${diff} min para seu agendamento na ${n.barbershop.name}!`
                    : n.status === 'CANCELED' ? `Cancelado em ${n.barbershop.name}` : `Confirmado: ${n.service.name}`
            }
        })
    }, [notifications, now])

    const unreadCount = enrichedNotifications.filter(n => n.isReminder || n.status === "CANCELED").length

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-secondary rounded-full">
                    <Bell size={20} className="text-gray-400" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] flex items-center justify-center font-bold text-white">{unreadCount}</span>
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#141518] border-l border-white/5 text-white w-full sm:max-w-md pt-[calc(env(safe-area-inset-top)+2rem)]">
                <SheetHeader className="mb-6"><SheetTitle className="text-white flex items-center gap-2"><Bell size={18} className="text-primary" /> Notificações</SheetTitle></SheetHeader>

                <div className="h-full overflow-y-auto pb-20 scrollbar-hide">
                    <div className="space-y-4">
                        {/* Status de Notificações Push */}
                        {isSupported && (
                            <div className="p-3 bg-[#1A1B1F] rounded-xl border border-white/5 mb-4">
                                {!subscription && permission === 'default' && (
                                    <Button variant="outline" size="sm" className="w-full h-8 border-primary/20 text-primary hover:text-primary hover:bg-primary/10" onClick={handleEnablePush}>
                                        Ativar Notificações Push
                                    </Button>
                                )}

                                {!subscription && permission === 'granted' && (
                                    <Button variant="outline" size="sm" className="w-full h-8 border-primary/20 text-primary hover:text-primary hover:bg-primary/10" onClick={handleEnablePush}>
                                        Sincronizar Notificações Push
                                    </Button>
                                )}

                                {subscription && (
                                    <div className="text-green-500 font-medium text-xs flex items-center justify-center gap-2 py-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        Notificações Ativas
                                    </div>
                                )}

                                {permission === 'denied' && (
                                    <div className="text-red-400 font-medium text-xs text-center py-1">
                                        Permissão de Push Negada
                                    </div>
                                )}
                            </div>
                        )}

                        {enrichedNotifications.length === 0 && (
                            <div className="text-center text-sm text-gray-500 py-8">
                                Nenhuma notificação encontrada.
                            </div>
                        )}
                        {enrichedNotifications.map((n) => (
                            <Link key={n.id} href="/appointments" className={`block p-4 rounded-2xl border transition-all ${n.isReminder ? 'bg-primary/10 border-primary/30 animate-pulse' : 'bg-[#1A1B1F] border-white/5'}`}>
                                <div className="flex gap-4">
                                    <div className={`p-2 rounded-xl h-fit ${n.isReminder ? 'bg-primary text-white' : n.status === 'CANCELED' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {n.isReminder ? <Clock size={18} /> : n.status === 'CANCELED' ? <XCircle size={18} /> : <CalendarCheck size={18} />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-tight">{n.displayText}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">{format(new Date(n.date), "HH:mm", { locale: ptBR })}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}