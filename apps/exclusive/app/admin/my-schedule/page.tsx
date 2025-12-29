"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

import { Card, CardContent, Button, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle, Calendar } from "@barbergo/ui"
import {
    format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths,
    isSameDay, startOfWeek, endOfWeek, isWithinInterval, differenceInMinutes, isToday
} from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    ChevronLeft, CheckCircle2, Clock, XCircle, User,
    CalendarCheck2, AlertTriangle, Check, X, Loader2,
    MessageCircle, Phone, Trash2, Search, ArrowUpDown,
    ChevronRight, Calendar as CalendarIcon, VolumeX, FileText
} from "lucide-react"
import Link from "next/link"
import { getAdminDashboard } from "@/_actions/get-admin-dashboard"
import { handleCancellationDecision } from "@/_actions/cancel-booking"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Footer from "@/_components/footer"
import HorizontalScroll from "../../_components/horizontal-scroll"
import { ConfirmDialog } from "../../_components/confirm-dialog"

export default function MySchedulePage() {
    const { status } = useSession()
    const router = useRouter()

    const [bookings, setBookings] = useState<any[]>([])
    const [filter, setFilter] = useState<"CONFIRMED" | "COMPLETED" | "CANCELED" | "WAITING_CANCELLATION">("CONFIRMED")
    const [period, setPeriod] = useState<"day" | "week" | "month">("day")
    const [viewDate, setViewDate] = useState(new Date())
    const [searchQuery, setSearchQuery] = useState("")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

    // Estados de Loading separados para evitar "pulo" de tela
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [isFetching, setIsFetching] = useState(false)
    const [isProcessing, setIsProcessing] = useState<string | null>(null)

    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    const loadData = useCallback(async (fullLoader = false) => {
        try {
            if (fullLoader) setIsInitialLoading(true)
            setIsFetching(true)
            const data = await getAdminDashboard(viewDate)
            setBookings(data.personalBookings || [])
        } catch (error) {
            console.error(error)
            toast.error("Erro ao sincronizar dados.")
        } finally {
            setIsInitialLoading(false)
            setIsFetching(false)
        }
    }, [viewDate])

    useEffect(() => {
        if (status === "unauthenticated") router.push("/")
        if (status === "authenticated") loadData(bookings.length === 0)
    }, [status, viewDate, loadData])

    // --- SISTEMA DE NOTIFICAÇÃO DO PRÓXIMO CLIENTE ---
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date()
            bookings.forEach(booking => {
                if (booking.status === "CONFIRMED") {
                    const bookingDate = new Date(booking.date)
                    const diff = differenceInMinutes(bookingDate, now)

                    if (diff === 15) {
                        // Tenta tocar um som discreto se o navegador permitir
                        try { new Audio('/notification.mp3').play() } catch (e) { }

                        toast.info(`PRÓXIMO CLIENTE EM 15 MIN: ${booking.user.name}`, {
                            description: `Serviço: ${booking.service.name}`,
                            duration: 15000,
                            action: {
                                label: "Avisar WhatsApp",
                                onClick: () => handleContactWhatsApp((booking.user as any).UserPhone || [], booking.user.name)
                            }
                        })
                    }
                }
            })
        }
        const interval = setInterval(checkReminders, 60000)
        return () => clearInterval(interval)
    }, [bookings])

    const handleNavigate = (direction: 'prev' | 'next') => {
        if (period === 'day') setViewDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1))
        else if (period === 'week') setViewDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1))
        else setViewDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
    }

    const onDecision = async () => {
        if (!selectedBookingId) return
        try {
            setIsProcessing(selectedBookingId)
            setIsConfirmOpen(false)
            await handleCancellationDecision(selectedBookingId, true)
            toast.success("Ação concluída!")
            await loadData()
        } catch (error) {
            toast.error("Erro no processamento.")
        } finally {
            setIsProcessing(null)
            setSelectedBookingId(null)
        }
    }

    const handleOpenConfirm = (id: string) => {
        setSelectedBookingId(id)
        setIsConfirmOpen(true)
    }

    const handleContactWhatsApp = (phones: any[], name: string) => {
        const target = phones.find(p => p.isWhatsApp) || phones[0]
        if (!target?.number) return toast.error("Cliente sem telefone.")
        const cleanPhone = target.number.replace(/\D/g, "")
        const message = encodeURIComponent(`Olá ${name}, aqui é da Barbearia. Tudo certo para seu agendamento em instantes?`)
        window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${message}`, "_blank", "noreferrer")
    }

    const handleCopyPhone = (phones: any[]) => {
        const phone = phones[0]?.number
        if (!phone) return toast.error("Telefone não encontrado.")
        navigator.clipboard.writeText(phone)
        toast.success("Copiado!")
    }

    const processedBookings = useMemo(() => {
        let result = bookings.filter(b => b.status === filter)

        if (period === 'day') {
            result = result.filter(b => isSameDay(new Date(b.date), viewDate))
        } else if (period === 'week') {
            const start = startOfWeek(viewDate, { weekStartsOn: 1 })
            const end = endOfWeek(viewDate, { weekStartsOn: 1 })
            result = result.filter(b => isWithinInterval(new Date(b.date), { start, end }))
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(b => b.user.name.toLowerCase().includes(q) || b.service.name.toLowerCase().includes(q))
        }

        return result.sort((a, b) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA
        })
    }, [bookings, filter, period, viewDate, searchQuery, sortOrder])

    const pendingCount = bookings.filter(b => b.status === "WAITING_CANCELLATION").length

    if (isInitialLoading || status === "loading") return (
        <div className="min-h-screen flex items-center justify-center bg-background text-white">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
    )

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">

            <div className="container mx-auto p-4 md:p-8 space-y-6 flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="hover:bg-secondary">
                            <Link href="/admin"><ChevronLeft /></Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Minha Agenda</h1>
                            <p className="text-primary text-xs uppercase font-black tracking-widest">
                                {isToday(viewDate) ? "Hoje, " : ""}
                                {period === 'day' ? format(viewDate, "dd 'de' MMMM", { locale: ptBR }) :
                                    period === 'week' ? `Semana de ${format(startOfWeek(viewDate, { weekStartsOn: 1 }), "dd/MM")}` :
                                        format(viewDate, "MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <Input
                                placeholder="Buscar cliente..."
                                className="pl-10 bg-[#1A1B1F] border-secondary h-11"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline" size="icon" className="border-secondary h-11 w-11"
                            onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                        >
                            <ArrowUpDown size={18} className={sortOrder === "desc" ? "rotate-180 transition-transform" : ""} />
                        </Button>
                    </div>
                </div>

                {/* NAVEGAÇÃO DE PERÍODO */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1A1B1F] p-3 rounded-2xl border border-white/5">
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
                        <Button variant={period === "day" ? "default" : "ghost"} size="sm" className="h-8 text-[10px] font-bold" onClick={() => setPeriod("day")}>DIA</Button>
                        <Button variant={period === "week" ? "default" : "ghost"} size="sm" className="h-8 text-[10px] font-bold" onClick={() => setPeriod("week")}>SEMANA</Button>
                        <Button variant={period === "month" ? "default" : "ghost"} size="sm" className="h-8 text-[10px] font-bold" onClick={() => setPeriod("month")}>MÊS</Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="h-8 w-8 border-white/10" onClick={() => handleNavigate('prev')}><ChevronLeft size={14} /></Button>
                        <Button
                            variant="ghost"
                            className={`h-8 text-[10px] font-black ${isToday(viewDate) ? 'text-primary' : 'text-gray-500'}`}
                            onClick={() => setIsCalendarOpen(true)}
                        >
                            <CalendarIcon size={14} className="mr-2" />
                            {isToday(viewDate) ? "HOJE" : format(viewDate, "dd/MM/yyyy")}
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 border-white/10" onClick={() => handleNavigate('next')}><ChevronRight size={14} /></Button>
                    </div>
                </div>

                <div className="py-2">
                    <HorizontalScroll>
                        <div className="flex gap-2 pr-4">
                            <FilterButton label="Agendados" icon={Clock} active={filter === "CONFIRMED"} onClick={() => setFilter("CONFIRMED")} variant="blue" />
                            <FilterButton label={`Solicitações ${pendingCount > 0 ? `(${pendingCount})` : ""}`} icon={AlertTriangle} active={filter === "WAITING_CANCELLATION"} onClick={() => setFilter("WAITING_CANCELLATION")} variant="warning" />
                            <FilterButton label="Finalizados" icon={CheckCircle2} active={filter === "COMPLETED"} onClick={() => setFilter("COMPLETED")} variant="green" />
                            <FilterButton label="Cancelados" icon={XCircle} active={filter === "CANCELED"} onClick={() => setFilter("CANCELED")} variant="destructive" />
                        </div>
                    </HorizontalScroll>
                </div>

                <div className="grid gap-4 relative">
                    {/* INDICADOR DE CARREGAMENTO NO COMPONENTE */}
                    {isFetching && (
                        <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[2px] flex items-start justify-center pt-20 rounded-3xl">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    )}

                    {processedBookings.length > 0 ? processedBookings.map((booking) => {
                        const userPhones = (booking.user as any).UserPhone || []
                        const hasPhone = userPhones.length > 0

                        return (
                            <Card key={booking.id} className="bg-[#1A1B1F] border-none ring-1 ring-white/5 overflow-hidden shadow-lg transition-all">
                                <CardContent className="p-0 flex items-stretch">
                                    <div className={`w-1.5 ${booking.status === 'WAITING_CANCELLATION' ? 'bg-amber-500 animate-pulse' :
                                        booking.status === 'CANCELED' ? 'bg-red-500' :
                                            booking.status === 'COMPLETED' ? 'bg-green-600' : 'bg-blue-500'
                                        }`} />

                                    <div className="p-4 flex flex-1 flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[65px]">
                                                <p className="text-xl font-bold text-white">{format(new Date(booking.date), "HH:mm")}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black">{format(new Date(booking.date), "dd MMM")}</p>
                                            </div>
                                            <div className="h-10 w-[1px] bg-white/10" />
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <User size={14} className="text-primary" />
                                                    <p className="font-bold text-white text-sm">{booking.user.name}</p>
                                                </div>
                                                <p className="text-xs text-gray-400">{booking.service.name}</p>

                                                {/* FLAGS DE OBSERVAÇÃO/SILÊNCIO */}
                                                {(booking.silentAppointment || booking.observation) && (
                                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                                        {booking.silentAppointment && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/20">
                                                                <VolumeX size={10} /> Silencioso
                                                            </div>
                                                        )}
                                                        {booking.observation && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 text-[9px] font-bold border border-white/5" title={booking.observation}>
                                                                <FileText size={10} /> Obs: {booking.observation.length > 20 ? booking.observation.substring(0, 20) + "..." : booking.observation}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 justify-end">
                                            {booking.status === "CONFIRMED" && (
                                                <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5 mr-2">
                                                    <Button size="icon" variant="ghost" className={`h-9 w-9 ${hasPhone ? 'text-green-500' : 'text-gray-700'}`} onClick={() => handleContactWhatsApp(userPhones, booking.user.name)} disabled={!hasPhone}><MessageCircle size={18} /></Button>
                                                    <Button size="icon" variant="ghost" className={`h-9 w-9 ${hasPhone ? 'text-blue-400' : 'text-gray-700'}`} onClick={() => handleCopyPhone(userPhones)} disabled={!hasPhone}><Phone size={18} /></Button>
                                                </div>
                                            )}

                                            {booking.status === "WAITING_CANCELLATION" && (
                                                <div className="flex gap-2 border-l border-white/10 pl-4">
                                                    <Button disabled={isProcessing === booking.id} size="sm" className="bg-green-600 h-9 px-4 text-[10px] font-black rounded-xl" onClick={() => { setSelectedBookingId(booking.id); onDecision(); }}>ACEITAR</Button>
                                                    <Button disabled={isProcessing === booking.id} size="sm" variant="ghost" className="text-red-500 h-9 px-4 text-[10px] font-black rounded-xl" onClick={() => handleOpenConfirm(booking.id)}>RECUSAR</Button>
                                                </div>
                                            )}

                                            {booking.status === "CONFIRMED" && (
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-500/10 h-9 px-4 text-[10px] font-black rounded-xl" onClick={() => handleOpenConfirm(booking.id)}>CANCELAR</Button>
                                            )}

                                            <Badge variant="secondary" className={`text-[10px] uppercase font-black ml-2 border-none ${booking.status === 'WAITING_CANCELLATION' ? 'text-amber-500 bg-amber-500/10' :
                                                booking.status === 'COMPLETED' ? 'text-green-500 bg-green-500/10' :
                                                    booking.status === 'CANCELED' ? 'text-red-500 bg-red-500/10' :
                                                        'text-blue-400 bg-blue-500/10'
                                                }`}>
                                                {booking.status === "WAITING_CANCELLATION" ? "Solicitado" :
                                                    booking.status === "CONFIRMED" ? "Agendado" :
                                                        booking.status === "COMPLETED" ? "Finalizado" : "Cancelado"}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    }) : (
                        <div className="text-center py-24 text-gray-600 border-2 border-dashed border-white/5 rounded-[32px]">
                            <CalendarCheck2 size={64} className="mx-auto mb-4 opacity-5" />
                            <p className="font-medium text-sm">Nada encontrado para este dia/filtro.</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Deseja prosseguir?"
                description="Esta ação liberará o horário imediatamente para outros clientes."
                onConfirm={onDecision}
                variant="destructive"
            />

            {/* SELETOR DE DATA */}
            <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <DialogContent className="w-[90%] rounded-2xl bg-[#1A1B1F] border-[#26272B] text-white p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b border-[#26272B]">
                        <DialogTitle>Selecionar Data</DialogTitle>
                    </DialogHeader>
                    <div className="p-4">
                        <Calendar
                            mode="single"
                            selected={viewDate}
                            onSelect={(date) => {
                                if (date) {
                                    setViewDate(date)
                                    setPeriod("day")
                                    setIsCalendarOpen(false)
                                }
                            }}
                            locale={ptBR}
                            className="rounded-xl border border-[#26272B] bg-black/20 w-full"
                            classNames={{
                                month: "space-y-4 w-full",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex w-full justify-between",
                                row: "flex w-full mt-2 justify-between",
                                head_cell: "text-gray-500 rounded-md w-full font-normal text-[0.8rem]",
                                cell: "h-9 w-full text-center text-sm p-0 relative focus-within:z-20",
                                day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-primary hover:text-white transition-all",
                                nav_button: "hover:bg-secondary rounded-md transition-colors",
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function FilterButton({ label, icon: Icon, active, onClick, variant = "default" }: any) {
    let activeClass = "bg-primary text-white"
    let inactiveText = "text-gray-400 border-white/5"

    switch (variant) {
        case "warning":
            activeClass = "bg-amber-600 text-white"
            inactiveText = "text-amber-500 border-amber-500/20"
            break
        case "destructive":
            activeClass = "bg-red-600 text-white"
            inactiveText = "text-red-500 border-red-500/20"
            break
        case "green":
            activeClass = "bg-green-600 text-white"
            inactiveText = "text-green-500 border-green-500/20"
            break
        case "blue":
            activeClass = "bg-blue-600 text-white"
            inactiveText = "text-blue-500 border-blue-500/20"
            break
        default:
            activeClass = "bg-primary text-white"
            inactiveText = "text-gray-400 border-white/5"
            break
    }

    return (
        <Button
            variant={active ? "default" : "secondary"}
            onClick={onClick}
            className={`rounded-xl gap-2 transition-all h-10 text-xs font-bold border whitespace-nowrap px-5 ${active ? activeClass : `bg-[#1A1B1F] ${inactiveText}`}`}
        >
            <Icon size={14} /> {label}
        </Button>
    )
}
