"use client"

import { useState, useMemo, useEffect } from "react"
import { Bell, CalendarPlus, XCircle, Clock } from "lucide-react"
import {
    Button,
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@barbergo/ui"
import { format, differenceInMinutes, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

export default function NotificationBell({ bookings }: { bookings: any[] }) {
    // Estado para forçar a atualização do componente a cada minuto
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const notifications = useMemo(() => {
        const waiting = bookings.filter(b => b.status === "WAITING_CANCELLATION")

        // Lógica de Lembrete: Agendamentos que começam em EXATAMENTE 15 minutos (ou entre 10 e 15 para margem)
        const reminders = bookings.filter(b => {
            if (b.status !== "CONFIRMED" || !isToday(new Date(b.date))) return false
            const diff = differenceInMinutes(new Date(b.date), now)
            return diff > 0 && diff <= 15
        })

        const recent = bookings.filter(b => b.status === "CONFIRMED").slice(0, 3)

        return [
            ...reminders.map(b => ({
                id: `rem-${b.id}`,
                type: 'reminder',
                text: `PRÓXIMO CLIENTE: ${b.user.name} (em ${differenceInMinutes(new Date(b.date), now)} min)`,
                date: b.date
            })),
            ...waiting.map(b => ({
                id: b.id,
                type: 'cancel',
                text: `Solicitação de cancelamento: ${b.user.name}`,
                date: b.date
            })),
            ...recent.map(b => ({
                id: `new-${b.id}`,
                type: 'new',
                text: `Novo agendamento: ${b.user.name}`,
                date: b.createdAt
            }))
        ]
    }, [bookings, now])

    const unreadCount = notifications.filter(n => n.type === 'cancel' || n.type === 'reminder').length

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-secondary rounded-full">
                    <Bell size={20} className="text-gray-400" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] items-center justify-center font-bold text-white">
                                {unreadCount}
                            </span>
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#141518] border-l border-white/5 text-white w-full sm:max-w-md">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-white flex items-center gap-2">
                        <Bell size={18} className="text-primary" /> Central do Profissional
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-4">
                    {notifications.length > 0 ? notifications.map((n) => (
                        <Link
                            key={n.id}
                            href="/admin/my-schedule"
                            className={`block p-4 rounded-2xl border transition-all group ${n.type === 'reminder' ? 'bg-primary/10 border-primary/30 animate-pulse' : 'bg-[#1A1B1F] border-white/5'
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className={`p-2 rounded-xl h-fit ${n.type === 'cancel' ? 'bg-amber-500/10 text-amber-500' :
                                        n.type === 'reminder' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                                    }`}>
                                    {n.type === 'cancel' ? <XCircle size={18} /> :
                                        n.type === 'reminder' ? <Clock size={18} /> : <CalendarPlus size={18} />}
                                </div>
                                <div className="space-y-1 flex-1">
                                    <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors uppercase tracking-tighter">
                                        {n.text}
                                    </p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">
                                        {format(new Date(n.date), "HH:mm 'às' dd/MM", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                            <Bell size={40} className="mb-2 opacity-10" />
                            <p className="text-sm">Sem novidades na agenda.</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}