"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Header from "../_components/header"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Dialog, DialogContent, DialogTrigger, Calendar, Skeleton } from "@barbergo/ui"
import {
    CalendarIcon, DollarSign, Users, ShieldCheck, User,
    CalendarCheck2, Settings2, Power, Loader2, Store,
    ChevronLeft, ChevronRight, CalendarDays, CreditCard,
    ShieldAlert, Star
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import AdminOverviewChart from "./_components/admin-overview-chart"
import AdminBookingList from "./_components/admin-booking-list"
import { getAdminDashboard } from "../_actions/get-admin-dashboard"
import { ConfirmDialog } from "../_components/confirm-dialog"
import { toggleStaffStatus } from "../_actions/manage-staff"
import Footer from "@/_components/footer"
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"

import NotificationBell from "../_components/notification-bell"

export default function AdminPage() {
    const { status } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [viewMode, setViewMode] = useState<"shop" | "personal">("shop")
    const [period, setPeriod] = useState<"day" | "week" | "month">("day") // Default to day per requirement: "por padrão ao inciar a pagina, ja mostra do dia corrente"
    const [viewDate, setViewDate] = useState(new Date())
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    // Tenta capturar o status de diferentes formas caso o objeto mude
    const subStatus = stats?.subscription?.status || stats?.subscriptionStatus

    const load = useCallback(async (date: Date, currentPeriod: "day" | "week" | "month") => {
        try {
            setIsLoading(true)
            const data = await getAdminDashboard(date, currentPeriod)
            setStats(data)
            if (data.role === "STAFF") setViewMode("personal")
        } catch (error) {
            console.error(error)
            // router.push("/") // Prevent redirect loop on error for now
        } finally {
            setIsLoading(false)
        }
    }, [router])

    useEffect(() => {
        if (status === "unauthenticated") router.push("/")
        if (status === "authenticated") load(viewDate, period)
    }, [status, viewDate, period, load, router])

    const handleNavigate = (direction: 'prev' | 'next') => {
        if (period === 'month') {
            setViewDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
        } else if (period === 'week') {
            setViewDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1))
        } else {
            setViewDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1))
        }
    }

    const chartDataToDisplay = useMemo(() => {
        if (!stats) return []
        const rawData = viewMode === "personal" ? stats.personalChartData : stats.chartData
        const bookings = viewMode === "personal" ? stats.personalBookings : stats.bookings

        if (period === "day") {
            // Restore Hourly aggregation for "Day" View
            const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 08:00 to 20:00
            return hours.map(h => ({
                date: `${h}h`,
                total: bookings
                    .filter((b: any) => {
                        const bookingDate = new Date(b.date)
                        return isSameDay(bookingDate, viewDate) && bookingDate.getHours() === h && b.status !== "CANCELED"
                    })
                    .reduce((acc: number, b: any) => acc + Number(b.service.price), 0)
            }))
        }

        // For Week/Month, server returns Daily data
        return rawData
    }, [stats, viewMode, period, viewDate])

    // REMOVED early return if generic isLoading. Will render Skeleton instead.
    // However, if !stats, we can't determine layout fully, but Skeleton mimics layout.
    // We'll proceed to render layout but conditionally show Skeleton or fallback if !stats && isLoading.

    // Quick fallback/loading handled by DashboardSkeleton:
    if (isLoading && !stats) return <DashboardSkeleton />
    if (!stats) return <div className="min-h-screen flex items-center justify-center bg-background">Erro ao carregar dados.</div>

    const isStaffActive = stats.personalKpi?.isActive === true

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative">
            <Header />

            {/* OVERLAY DE BLOQUEIO (SUSPENDED) - Z-INDEX MÁXIMO */}
            {subStatus === 'SUSPENDED' && (
                <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 overflow-hidden">
                    <Card className="max-w-md w-full bg-[#1A1B1F] border-red-500/50 shadow-2xl shadow-red-500/40 animate-in zoom-in-95 duration-300">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldAlert size={32} className="text-red-500" />
                            </div>
                            <CardTitle className="text-xl font-bold text-white uppercase tracking-tight">Acesso Bloqueado</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-6 pb-8">
                            <p className="text-sm text-gray-400">
                                Sua assinatura está suspensa por pendências financeiras. Regularize para reativar sua agenda e o painel administrativo.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button asChild className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 shadow-lg shadow-red-600/20">
                                    <Link href="/admin/billing">Ir para Assinatura</Link>
                                </Button>
                                <Button variant="ghost" className="text-gray-500 text-xs hover:text-white" asChild>
                                    <Link href="https://wa.me/558421335813">Falar com Suporte</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* CONTEÚDO DO DASHBOARD - APLICA BLUR SE SUSPENDED */}
            <div className={`flex-1 flex flex-col transition-all duration-500 ${subStatus === 'SUSPENDED' ? 'blur-2xl pointer-events-none select-none grayscale-[50%]' : ''}`}>
                <div className="container mx-auto p-4 md:p-6 space-y-8 flex-1">

                    {/* BANNER DE ATRASO (PAST_DUE) - MOVED ABOVE FILTERS */}
                    {subStatus === 'PAST_DUE' && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-3 text-center sm:text-left">
                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500 shrink-0">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Pagamento Atrasado</p>
                                    <p className="text-xs text-gray-400">Evite o bloqueio da sua agenda realizando o pagamento da sua mensalidade.</p>
                                </div>
                            </div>
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold whitespace-nowrap" asChild>
                                <Link href="/admin/billing">Regularizar Agora</Link>
                            </Button>
                        </div>
                    )}

                    {/* FILTER BAR - NEW */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1A1B1F] p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 gap-1 shrink-0">
                                <Button variant={period === "day" ? "default" : "ghost"} size="sm" className="h-8 text-xs font-bold" onClick={() => setPeriod("day")}>Dia</Button>
                                <Button variant={period === "week" ? "default" : "ghost"} size="sm" className="h-8 text-xs font-bold" onClick={() => setPeriod("week")}>Semana</Button>
                                <Button variant={period === "month" ? "default" : "ghost"} size="sm" className="h-8 text-xs font-bold" onClick={() => setPeriod("month")}>Mês</Button>
                            </div>

                            <div className="flex items-center gap-2 border-l border-white/10 pl-4 shrink-0">
                                <Button variant="outline" size="icon" className="h-8 w-8 border-white/5 bg-black/20" onClick={() => handleNavigate('prev')}><ChevronLeft size={16} /></Button>
                                <div className="text-sm font-medium text-white min-w-[140px] text-center capitalize">
                                    {period === 'month' ? format(viewDate, "MMMM 'de' yyyy", { locale: ptBR }) :
                                        period === 'week' ? `Sem. ${format(startOfWeek(viewDate), "dd")} - ${format(endOfWeek(viewDate), "dd MMM", { locale: ptBR })}` :
                                            format(viewDate, "EEEE, dd MMM", { locale: ptBR })}
                                </div>
                                <Button variant="outline" size="icon" className="h-8 w-8 border-white/5 bg-black/20" onClick={() => handleNavigate('next')}><ChevronRight size={16} /></Button>
                            </div>

                            <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 border-white/5 bg-black/20 text-xs gap-2">
                                        <CalendarDays size={14} /> Escolher Data
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#1A1B1F] border-white/10 text-white">
                                    <div className="p-4 flex justify-center">
                                        <Calendar
                                            mode="single"
                                            selected={viewDate}
                                            onSelect={(date) => { if (date) { setViewDate(date); setIsCalendarOpen(false) } }}
                                            className="rounded-md border border-white/10"
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-white" onClick={() => setViewDate(new Date())}>Hoje</Button>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            {/* Actions or additional info can go here */}
                        </div>
                    </div>

                    {isLoading ? (
                        // Skeleton Loading State when RE-FETCHING data (stats exist but stale/loading new)
                        <SkeletonContent />
                    ) : (
                        <>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                                            {viewMode === "personal" ? "Meu Perfil Profissional" : "Painel da Barbearia"}
                                        </h2>
                                        <Badge className={stats.role === "ADMIN" ? "bg-primary" : "bg-green-600"}>{stats.role}</Badge>
                                        <NotificationBell bookings={viewMode === "personal" ? stats.personalBookings : stats.bookings} />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                                    {stats.role === "ADMIN" && stats.isBarber && (
                                        <div className="bg-[#1A1B1F] p-1 rounded-lg border border-secondary flex gap-1 h-11 md:h-10">
                                            <Button variant={viewMode === "shop" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("shop")} className="flex-1 text-xs gap-2"><Store size={14} /> Barbearia</Button>
                                            <Button variant={viewMode === "personal" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("personal")} className="flex-1 text-xs gap-2"><User size={14} /> Individual</Button>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                                        {viewMode === "personal" ? (
                                            <>
                                                <Button variant="outline" className="border-secondary h-11 text-xs text-white" asChild><Link href="/admin/my-schedule"><CalendarCheck2 size={16} className="mr-2 text-primary" /> Agenda</Link></Button>
                                                <Button variant="outline" className="border-secondary h-11 text-xs text-white" asChild><Link href="/admin/my-hours"><Settings2 size={16} className="mr-2 text-primary" /> Horários</Link></Button>
                                                <Button variant={isStaffActive ? "destructive" : "default"} size="sm" onClick={() => setIsConfirmOpen(true)} className={`h-11 col-span-2 sm:col-auto text-xs font-semibold ${!isStaffActive && 'bg-green-600 text-white'}`}><Power size={16} className="mr-2" /> {isStaffActive ? "Inativar" : "Ativar"}</Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button variant="outline" asChild className="h-11 text-xs border-amber-500/50 text-amber-500 hover:bg-amber-500/10"><Link href="/admin/billing"><CreditCard size={16} className="mr-2" /> Assinatura</Link></Button>

                                                <Button variant="outline" asChild className="h-11 text-xs border-secondary text-white hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors">
                                                    <Link href="/admin/ratings">
                                                        <Star size={16} className="mr-2" /> Avaliações
                                                    </Link>
                                                </Button>

                                                <Button variant="outline" asChild className="h-11 text-xs border-secondary text-white hover:bg-white/5">
                                                    <Link href="/admin/clients">
                                                        <Users size={16} className="mr-2" /> Clientes
                                                    </Link>
                                                </Button>

                                                <Button variant="outline" asChild className="h-11 text-xs border-secondary text-white"><Link href="/admin/settings">Configurações</Link></Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <KpiCard title={viewMode === "personal" ? "Meus Resultados" : "Faturamento"} icon={DollarSign} value={viewMode === "personal" ? stats.personalKpi.revenue : stats.kpi.revenue} isMoney />
                                <KpiCard title="Minha Agenda" icon={CalendarIcon} value={viewMode === "personal" ? stats.personalKpi.bookings : stats.kpi.bookings} />
                                <KpiCard title="Agenda Hoje" icon={Users} value={viewMode === "personal" ? stats.personalKpi.today : stats.kpi.today} sub="Clientes agendados" />
                                <KpiCard title="Status" icon={ShieldCheck} value={viewMode === "personal" ? (isStaffActive ? "Ativo" : "Inativo") : (stats.kpi.isClosed ? "Fechada" : "Aberta")} />
                            </div>

                            <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
                                <Card className="col-span-1 md:col-span-4 bg-[#1A1B1F] border-none shadow-xl ring-1 ring-white/5">
                                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary"><CalendarDays size={20} /></div>
                                            <div>
                                                <CardTitle className="text-white text-sm uppercase tracking-widest font-bold">Produtividade (R$)</CardTitle>
                                                <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase">
                                                    Resumo Financeiro
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <AdminOverviewChart data={chartDataToDisplay} />
                                    </CardContent>
                                </Card>

                                <Card className="col-span-1 md:col-span-3 bg-[#1A1B1F] border-none shadow-xl ring-1 ring-white/5">
                                    <CardHeader><CardTitle className="text-white text-sm uppercase tracking-widest font-bold">Próximos Clientes</CardTitle></CardHeader>
                                    <CardContent><AdminBookingList bookings={viewMode === "personal" ? stats.personalBookings : stats.bookings} /></CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
                <Footer />
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title={isStaffActive ? "Pausar atendimento?" : "Reativar?"}
                onConfirm={async () => { await toggleStaffStatus(stats.barberId, !isStaffActive); load(viewDate, period); setIsConfirmOpen(false); }}
                variant={isStaffActive ? "destructive" : "default"}
                description={isStaffActive
                    ? "Ao inativar, seu perfil não aparecerá mais para novos agendamentos e sua agenda ficará bloqueada."
                    : "Ao reativar, os clientes poderão agendar horários com você novamente através do portal."
                }
            />
        </div>
    )
}

function KpiCard({ title, icon: Icon, value, sub, isMoney }: any) {
    return (
        <Card className="bg-[#1A1B1F] border-none shadow-sm ring-1 ring-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-white">
                    {isMoney && typeof value === 'number' ? Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value) : value}
                </div>
                {sub && <p className="text-xs text-gray-500">{sub}</p>}
            </CardContent>
        </Card>
    )
}

function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative animate-pulse">
            <Header />
            <div className="flex-1 flex flex-col p-4 md:p-6 space-y-8">
                {/* Filter Skeleton */}
                <Skeleton className="h-16 w-full rounded-xl bg-[#1A1B1F]/50" />

                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <Skeleton className="h-10 w-64 bg-[#1A1B1F]/50" />
                    <Skeleton className="h-10 w-full md:w-96 bg-[#1A1B1F]/50" />
                </div>

                {/* KPI Grid Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-32 bg-[#1A1B1F]/50 rounded-xl" />
                    ))}
                </div>

                {/* Charts Grid Skeleton */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
                    <Skeleton className="col-span-1 md:col-span-4 h-96 bg-[#1A1B1F]/50 rounded-xl" />
                    <Skeleton className="col-span-1 md:col-span-3 h-96 bg-[#1A1B1F]/50 rounded-xl" />
                </div>
            </div>
            <Footer />
        </div>
    )
}

function SkeletonContent() {
    return (
        <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <Skeleton className="h-10 w-64 bg-[#1A1B1F]/50" />
                <Skeleton className="h-10 w-full md:w-96 bg-[#1A1B1F]/50" />
            </div>

            {/* KPI Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-32 bg-[#1A1B1F]/50 rounded-xl" />
                ))}
            </div>

            {/* Charts Grid Skeleton */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
                <Skeleton className="col-span-1 md:col-span-4 h-96 bg-[#1A1B1F]/50 rounded-xl" />
                <Skeleton className="col-span-1 md:col-span-3 h-96 bg-[#1A1B1F]/50 rounded-xl" />
            </div>
        </div>
    )
}