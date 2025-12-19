"use client"

import { useState, useEffect, useCallback } from "react"
import Header from "../../_components/header"
import { Card, CardContent, Button, Badge } from "@barbergo/ui"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, CheckCircle2, Clock, XCircle, User, CalendarCheck2, AlertTriangle, Check, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { getAdminDashboard } from "@/_actions/get-admin-dashboard"
import { handleCancellationDecision } from "@/_actions/cancel-booking"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Footer from "@/_components/footer"

export default function MySchedulePage() {
    const { status } = useSession()
    const router = useRouter()

    const [bookings, setBookings] = useState<any[]>([])
    const [filter, setFilter] = useState<"CONFIRMED" | "FINISHED" | "CANCELED" | "WAITING_CANCELLATION">("CONFIRMED")
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)
            const data = await getAdminDashboard()
            setBookings(data.personalBookings || [])
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (status === "unauthenticated") router.push("/")
        if (status === "authenticated") loadData()
    }, [status, router, loadData])

    const onDecision = async (id: string, accept: boolean) => {
        try {
            setIsProcessing(id)
            await handleCancellationDecision(id, accept)
            toast.success(accept ? "Agendamento cancelado!" : "Solicitação recusada.")
            await loadData()
        } catch (error) {
            toast.error("Erro ao processar.")
        } finally {
            setIsProcessing(null)
        }
    }

    const filteredBookings = bookings.filter(b => b.status === filter)
    const pendingCount = bookings.filter(b => b.status === "WAITING_CANCELLATION").length

    if (isLoading || status === "loading") return <div className="min-h-screen flex items-center justify-center bg-background text-white"><Loader2 className="animate-spin text-primary" size={40} /></div>

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">
            <Header />
            <div className="container mx-auto p-4 md:p-8 space-y-6 flex-1">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild><Link href="/admin"><ChevronLeft /></Link></Button>
                    <div><h1 className="text-2xl font-bold">Minha Agenda</h1><p className="text-muted-foreground text-sm">Controle seus atendimentos</p></div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button variant={filter === "CONFIRMED" ? "default" : "secondary"} onClick={() => setFilter("CONFIRMED")} className="rounded-full gap-2 transition-all"><Clock size={16} /> Agendados</Button>
                    <Button variant={filter === "WAITING_CANCELLATION" ? "default" : "secondary"} onClick={() => setFilter("WAITING_CANCELLATION")} className={`rounded-full gap-2 transition-all ${filter === "WAITING_CANCELLATION" ? "bg-amber-600" : "text-amber-500"}`}><AlertTriangle size={16} /> Solicitações {pendingCount > 0 && `(${pendingCount})`}</Button>
                    <Button variant={filter === "FINISHED" ? "default" : "secondary"} onClick={() => setFilter("FINISHED")} className="rounded-full gap-2"><CheckCircle2 size={16} /> Finalizados</Button>
                    <Button variant={filter === "CANCELED" ? "default" : "secondary"} onClick={() => setFilter("CANCELED")} className="rounded-full gap-2"><XCircle size={16} /> Cancelados</Button>
                </div>

                <div className="grid gap-4">
                    {filteredBookings.map((booking) => (
                        <Card key={booking.id} className="bg-[#1A1B1F] border-none ring-1 ring-white/5 overflow-hidden shadow-lg">
                            <CardContent className="p-0 flex items-stretch">
                                <div className={`w-1.5 ${booking.status === 'WAITING_CANCELLATION' ? 'bg-amber-500 animate-pulse' : 'bg-primary'}`} />
                                <div className="p-4 flex flex-1 items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center min-w-[65px]"><p className="text-xl font-bold">{format(new Date(booking.date), "HH:mm")}</p><p className="text-[10px] text-gray-500 uppercase font-black">{format(new Date(booking.date), "dd MMM")}</p></div>
                                        <div className="h-10 w-[1px] bg-white/10" />
                                        <div><div className="flex items-center gap-2 mb-0.5"><User size={14} className="text-primary" /><p className="font-bold text-sm">{booking.user.name}</p></div><p className="text-xs text-gray-400">{booking.service.name}</p></div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                                        {booking.status === "WAITING_CANCELLATION" && (
                                            <div className="flex gap-2">
                                                <Button disabled={isProcessing === booking.id} size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-[10px] font-black uppercase" onClick={() => onDecision(booking.id, true)}>{isProcessing === booking.id ? <Loader2 className="animate-spin" size={12} /> : <Check size={14} />} Aceitar</Button>
                                                <Button disabled={isProcessing === booking.id} size="sm" variant="ghost" className="text-red-500 hover:bg-red-500/10 h-8 text-[10px] font-black uppercase" onClick={() => onDecision(booking.id, false)}><X size={14} /> Recusar</Button>
                                            </div>
                                        )}
                                        <Badge variant="secondary" className={`text-[10px] uppercase font-black ${booking.status === 'WAITING_CANCELLATION' ? 'text-amber-500 bg-amber-500/10' : 'text-gray-400'}`}>{booking.status === "WAITING_CANCELLATION" ? "Solicitado" : booking.status}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredBookings.length === 0 && <div className="text-center py-20 text-gray-600"><CalendarCheck2 size={48} className="mx-auto mb-4 opacity-10" /><p>Nenhum registro encontrado.</p></div>}
                </div>
            </div>
            <Footer />
        </div>
    )
}