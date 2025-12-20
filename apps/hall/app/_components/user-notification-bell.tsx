"use client"

import { useState, useEffect, useMemo } from "react"
import { Bell, CalendarCheck, XCircle, Timer, Clock } from "lucide-react"
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@barbergo/ui"
import { format, differenceInMinutes, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { getUserNotifications } from "@/_actions/get-user-notifications"

export default function UserNotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [now, setNow] = useState(new Date())

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
                    ? `LEMBRETE: Seu corte em ${n.barbershop.name} começa em ${diff} min!`
                    : n.status === 'CANCELED' ? `Agendamento cancelado em ${n.barbershop.name}` :
                        n.status === 'WAITING_CANCELLATION' ? `Aguardando cancelamento em ${n.barbershop.name}` :
                            `Confirmado: ${n.service.name}`
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
                    {enrichedNotifications.length > 0 ? enrichedNotifications.map((n) => (
                        <Link
                            key={n.id}
                            href="/appointments"
                            className={`block p-4 rounded-2xl border transition-all group ${n.isReminder ? 'bg-primary/10 border-primary/30 animate-pulse' : 'bg-[#1A1B1F] border-white/5'
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className={`p-2 rounded-xl h-fit ${n.isReminder ? 'bg-primary text-white' :
                                        n.status === 'CANCELED' ? 'bg-red-500/10 text-red-500' :
                                            'bg-green-500/10 text-green-500'
                                    }`}>
                                    {n.isReminder ? <Clock size={18} /> :
                                        n.status === 'CANCELED' ? <XCircle size={18} /> : <CalendarCheck size={18} />}
                                </div>
                                <div className="space-y-1">
                                    <p className={`text-sm font-medium leading-tight ${n.isReminder ? 'text-primary' : ''}`}>
                                        {n.displayText}
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