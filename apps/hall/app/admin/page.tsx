"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Header from "../_components/header"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@barbergo/ui"
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
    const [period, setPeriod] = useState<"day" | "week" | "month">("month")
    const [viewDate, setViewDate] = useState(new Date())
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    // Tenta capturar o status de diferentes formas caso o objeto mude
    const subStatus = stats?.subscription?.status || stats?.subscriptionStatus

    const load = useCallback(async (date: Date) => {
        try {
            setIsLoading(true)
            const data = await getAdminDashboard(date)
            setStats(data)
            if (data.role === "STAFF") setViewMode("personal")
        } catch (error) {
            router.push("/")
        } finally {
            setIsLoading(false)
        }
    }, [router])

    useEffect(() => {
        if (status === "unauthenticated") router.push("/")
        if (status === "authenticated") load(viewDate)
    }, [status, viewDate, load, router])

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
            const hours = Array.from({ length: 13 }, (_, i) => i + 8)
            return hours.map(h => ({
                date: `${h}h`,
                total: bookings
                    .filter((b: any) => isSameDay(new Date(b.date), viewDate) && new Date(b.date).getHours() === h && b.status !== "CANCELED")
                    .reduce((acc: number, b: any) => acc + Number(b.service.price), 0)
            }))
        }

        if (period === "week") {
            const start = startOfWeek(viewDate, { weekStartsOn: 1 })
            const end = endOfWeek(viewDate, { weekStartsOn: 1 })
            return rawData.filter((d: any) => {
                const date = new Date(d.fullDate)
                return date >= start && date <= end
            })
        }

        return rawData
    }, [stats, viewMode, period, viewDate])

    if (isLoading || !stats) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={40} /></div>

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

                    {/* BANNER DE ATRASO (PAST_DUE) */}
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

                                        {/* Botão de Avaliações */}
                                        <Button variant="outline" asChild className="h-11 text-xs border-secondary text-white hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors">
                                            <Link href="/admin/ratings">
                                                <Star size={16} className="mr-2" /> Avaliações
                                            </Link>
                                        </Button>

                                        {/* NOVO: Botão de Clientes */}
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
                                            {period === 'month' ? format(viewDate, "MMMM 'de' yyyy", { locale: ptBR }) :
                                                period === 'week' ? `Semana de ${format(viewDate, "dd MMM", { locale: ptBR })}` :
                                                    format(viewDate, "dd 'de' MMMM", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 gap-1">
                                        <Button variant={period === "day" ? "default" : "ghost"} size="sm" className="h-7 px-3 text-[10px] uppercase font-bold" onClick={() => setPeriod("day")}>Dia</Button>
                                        <Button variant={period === "week" ? "default" : "ghost"} size="sm" className="h-7 px-3 text-[10px] uppercase font-bold" onClick={() => setPeriod("week")}>Semana</Button>
                                        <Button variant={period === "month" ? "default" : "ghost"} size="sm" className="h-7 px-3 text-[10px] uppercase font-bold" onClick={() => setPeriod("month")}>Mês</Button>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="icon" className="h-9 w-9 border-white/5 bg-black/20" onClick={() => handleNavigate('prev')}><ChevronLeft size={16} /></Button>
                                        <Button variant="outline" size="icon" className="h-9 w-9 border-white/5 bg-black/20" onClick={() => handleNavigate('next')}><ChevronRight size={16} /></Button>
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
                </div>
                <Footer />
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title={isStaffActive ? "Pausar atendimento?" : "Reativar?"}
                onConfirm={async () => { await toggleStaffStatus(stats.barberId, !isStaffActive); load(viewDate); setIsConfirmOpen(false); }}
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