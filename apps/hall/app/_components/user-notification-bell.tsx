"use client"

import { useState, useEffect, useMemo } from "react"
import { Bell, CalendarCheck, XCircle, Timer } from "lucide-react"
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, Badge } from "@barbergo/ui"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { getUserNotifications } from "@/_actions/get-user-notifications"

export default function UserNotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            const data = await getUserNotifications()
            setNotifications(data)
        }
        load()
    }, [])

    // Contador de notificações "críticas" (Cancelamentos aprovados ou solicitações)
    const unreadCount = useMemo(() => {
        return notifications.filter(n => n.status === "WAITING_CANCELLATION" || n.status === "CANCELED").length
    }, [notifications])

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-secondary rounded-full">
                    <Bell size={20} className="text-gray-400" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] flex items-center justify-center font-bold text-white">
                                {unreadCount}
                            </span>
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#141518] border-l border-white/5 text-white w-full sm:max-w-md">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-white flex items-center gap-2">
                        <Bell size={18} className="text-primary" /> Minhas Notificações
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-4">
                    {notifications.length > 0 ? notifications.map((n) => (
                        <Link
                            key={n.id}
                            href="/appointments"
                            className="block p-4 rounded-2xl bg-[#1A1B1F] border border-white/5 hover:border-primary/30 transition-all group"
                        >
                            <div className="flex gap-4">
                                <div className={`p-2 rounded-xl h-fit ${n.status === 'CANCELED' ? 'bg-red-500/10 text-red-500' :
                                        n.status === 'WAITING_CANCELLATION' ? 'bg-amber-500/10 text-amber-500' :
                                            'bg-green-500/10 text-green-500'
                                    }`}>
                                    {n.status === 'CANCELED' ? <XCircle size={18} /> :
                                        n.status === 'WAITING_CANCELLATION' ? <Timer size={18} /> :
                                            <CalendarCheck size={18} />}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-tight">
                                        {n.status === 'CANCELED' ? `Agendamento cancelado em ${n.barbershop.name}` :
                                            n.status === 'WAITING_CANCELLATION' ? `Aguardando cancelamento em ${n.barbershop.name}` :
                                                `Agendamento confirmado: ${n.service.name}`}
                                    </p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">
                                        {format(new Date(n.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                            <Bell size={40} className="mb-2 opacity-10" />
                            <p className="text-sm">Nenhuma notificação por enquanto.</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}