"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Header from "../../_components/header"
import { Card, CardContent, Button, Badge, Input } from "@barbergo/ui"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    ChevronLeft, CheckCircle2, Clock, XCircle, User,
    CalendarCheck2, AlertTriangle, Check, X, Loader2,
    MessageCircle, Phone, Trash2, Search, ArrowUpDown
} from "lucide-react"
import Link from "next/link"
import { getAdminDashboard } from "@/_actions/get-admin-dashboard"
import { handleCancellationDecision } from "@/_actions/cancel-booking"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Footer from "@/_components/footer"
import HorizontalScroll from "../../_components/horizontal-scroll"

export default function MySchedulePage() {
    const { status } = useSession()
    const router = useRouter()

    const [bookings, setBookings] = useState<any[]>([])
    const [filter, setFilter] = useState<"CONFIRMED" | "FINISHED" | "CANCELED" | "WAITING_CANCELLATION">("CONFIRMED")
    const [searchQuery, setSearchQuery] = useState("")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
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
            toast.success(accept ? "Ação realizada com sucesso!" : "Solicitação recusada.")
            await loadData()
        } catch (error) {
            toast.error("Erro ao processar.")
        } finally {
            setIsProcessing(null)
        }
    }

    const handleContactWhatsApp = (phone: string, name: string) => {
        const cleanPhone = phone.replace(/\D/g, "")
        const message = encodeURIComponent(`Olá ${name}, aqui é da Barbearia. Gostaria de falar sobre seu agendamento.`)
        window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank")
    }

    const handleCopyPhone = (phone: string) => {
        navigator.clipboard.writeText(phone)
        toast.success("Telefone copiado para discagem!")
    }

    // Lógica de Filtro, Busca e Ordenação
    const processedBookings = useMemo(() => {
        let result = bookings.filter(b => b.status === filter)

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(b =>
                b.user.name.toLowerCase().includes(query) ||
                b.service.name.toLowerCase().includes(query)
            )
        }

        return result.sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA
        })
    }, [bookings, filter, searchQuery, sortOrder])

    const pendingCount = bookings.filter(b => b.status === "WAITING_CANCELLATION").length

    if (isLoading || status === "loading") return (
        <div className="min-h-screen flex items-center justify-center bg-background text-white">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
    )

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">
            <Header />
            <div className="container mx-auto p-4 md:p-8 space-y-6 flex-1">
                {/* Header e Título */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="hover:bg-secondary">
                            <Link href="/admin"><ChevronLeft /></Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Minha Agenda</h1>
                            <p className="text-muted-foreground text-sm">Gestão de atendimentos</p>
                        </div>
                    </div>

                    {/* Busca e Ordenação */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <Input
                                placeholder="Buscar cliente ou serviço..."
                                className="pl-10 bg-[#1A1B1F] border-secondary"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-secondary"
                            onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                        >
                            <ArrowUpDown size={18} className={sortOrder === "desc" ? "rotate-180 transition-transform" : "transition-transform"} />
                        </Button>
                    </div>
                </div>

                {/* Filtros com Scroll Horizontal */}
                <div className="py-2">
                    <HorizontalScroll>
                        <div className="flex gap-2 pr-4">
                            <FilterButton label="Agendados" icon={Clock} active={filter === "CONFIRMED"} onClick={() => setFilter("CONFIRMED")} />
                            <FilterButton
                                label={`Solicitações ${pendingCount > 0 ? `(${pendingCount})` : ""}`}
                                icon={AlertTriangle}
                                active={filter === "WAITING_CANCELLATION"}
                                onClick={() => setFilter("WAITING_CANCELLATION")}
                                variant="warning"
                            />
                            <FilterButton label="Finalizados" icon={CheckCircle2} active={filter === "FINISHED"} onClick={() => setFilter("FINISHED")} />
                            <FilterButton label="Cancelados" icon={XCircle} active={filter === "CANCELED"} onClick={() => setFilter("CANCELED")} />
                        </div>
                    </HorizontalScroll>
                </div>

                {/* Listagem */}
                <div className="grid gap-4">
                    {processedBookings.length > 0 ? processedBookings.map((booking) => (
                        <Card key={booking.id} className="bg-[#1A1B1F] border-none ring-1 ring-white/5 overflow-hidden shadow-lg hover:ring-primary/30 transition-all">
                            <CardContent className="p-0 flex items-stretch">
                                <div className={`w-1.5 ${booking.status === 'WAITING_CANCELLATION' ? 'bg-amber-500 animate-pulse' :
                                        booking.status === 'CANCELED' ? 'bg-red-500' : 'bg-primary'
                                    }`} />

                                <div className="p-4 flex flex-1 flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center min-w-[65px]">
                                            <p className="text-xl font-bold">{format(new Date(booking.date), "HH:mm")}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-black">{format(new Date(booking.date), "dd MMM")}</p>
                                        </div>
                                        <div className="h-10 w-[1px] bg-white/10" />
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <User size={14} className="text-primary" />
                                                <p className="font-bold text-white text-sm">{booking.user.name}</p>
                                            </div>
                                            <p className="text-xs text-gray-400">{booking.service.name}</p>
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="flex flex-wrap items-center gap-2 justify-end">
                                        {/* Ações de Contato (Apenas para agendados ou solicitações) */}
                                        {(booking.status === "CONFIRMED" || booking.status === "WAITING_CANCELLATION") && (
                                            <>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/10" onClick={() => handleContactWhatsApp("999999999", booking.user.name)}>
                                                    <MessageCircle size={18} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:bg-blue-500/10" onClick={() => handleCopyPhone("999999999")}>
                                                    <Phone size={18} />
                                                </Button>
                                            </>
                                        )}

                                        {/* Decisão de Cancelamento solicitado */}
                                        {booking.status === "WAITING_CANCELLATION" && (
                                            <div className="flex gap-2 ml-2 border-l border-white/10 pl-2">
                                                <Button disabled={isProcessing === booking.id} size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-[10px] font-black uppercase" onClick={() => onDecision(booking.id, true)}>
                                                    {isProcessing === booking.id ? <Loader2 className="animate-spin" size={12} /> : <Check size={14} />} Aceitar
                                                </Button>
                                                <Button disabled={isProcessing === booking.id} size="sm" variant="ghost" className="text-red-500 hover:bg-red-500/10 h-8 text-[10px] font-black uppercase" onClick={() => onDecision(booking.id, false)}>
                                                    <X size={14} /> Recusar
                                                </Button>
                                            </div>
                                        )}

                                        {/* Cancelamento Direto (Para agendados) */}
                                        {booking.status === "CONFIRMED" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:bg-red-500/10 h-8 text-[10px] font-black uppercase ml-2"
                                                onClick={() => onDecision(booking.id, true)}
                                            >
                                                <Trash2 size={14} className="mr-1" /> Cancelar
                                            </Button>
                                        )}

                                        <Badge variant="secondary" className={`text-[10px] uppercase font-black ml-2 ${booking.status === 'WAITING_CANCELLATION' ? 'text-amber-500 bg-amber-500/10' : 'text-gray-400'
                                            }`}>
                                            {booking.status === "WAITING_CANCELLATION" ? "Solicitado" :
                                                booking.status === "CONFIRMED" ? "Agendado" :
                                                    booking.status === "FINISHED" ? "Finalizado" : "Cancelado"}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="text-center py-20 text-gray-600 border-2 border-dashed border-white/5 rounded-3xl">
                            <CalendarCheck2 size={48} className="mx-auto mb-4 opacity-10" />
                            <p>Nenhum agendamento encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    )
}

function FilterButton({ label, icon: Icon, active, onClick, variant = "default" }: any) {
    const activeClass = variant === "warning" ? "bg-amber-600 text-white" : "bg-primary text-white"
    const inactiveText = variant === "warning" ? "text-amber-500 border-amber-500/20" : "text-gray-400 border-white/5"

    return (
        <Button
            variant={active ? "default" : "secondary"}
            onClick={onClick}
            className={`rounded-full gap-2 transition-all h-9 text-xs font-bold border whitespace-nowrap ${active ? activeClass : `bg-[#1A1B1F] ${inactiveText}`}`}
        >
            <Icon size={14} /> {label}
        </Button>
    )
}