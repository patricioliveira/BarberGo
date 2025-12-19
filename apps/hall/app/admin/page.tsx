"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Header from "../_components/header"
import { Card, CardContent, CardHeader, CardTitle, Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, Badge } from "@barbergo/ui"
import {
    CalendarIcon, DollarSign, Users, ShieldCheck, User,
    CalendarCheck2, Settings2, Power, Loader2, Store, Bell, CalendarPlus, XCircle
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import AdminOverviewChart from "./_components/admin-overview-chart"
import AdminBookingList from "./_components/admin-booking-list"
import { getAdminDashboard } from "../_actions/get-admin-dashboard"
import { ConfirmDialog } from "../_components/confirm-dialog"
import { toggleStaffStatus } from "../_actions/manage-staff"
import { toast } from "sonner"
import Footer from "@/_components/footer"
import { format, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function AdminPage() {
    const { status } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [viewMode, setViewMode] = useState<"shop" | "personal">("shop")
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    const load = useCallback(async () => {
        try {
            setIsLoading(true)
            const data = await getAdminDashboard()
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
        if (status === "authenticated") load()
    }, [status, load, router])

    const notifications = useMemo(() => {
        if (!stats?.personalBookings) return []
        return stats.personalBookings.filter((b: any) => b.status === "WAITING_CANCELLATION" || (isToday(new Date(b.date)) && b.status === "CONFIRMED"))
    }, [stats])

    if (isLoading || !stats) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={40} /></div>

    const isStaffActive = stats.personalKpi?.isActive === true

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />
            <div className="container mx-auto p-4 md:p-6 space-y-8 flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            {viewMode === "personal" ? "Meu Perfil Profissional" : "Painel da Barbearia"}
                            <Badge className={stats.role === "ADMIN" ? "bg-primary" : "bg-green-600"}>{stats.role}</Badge>
                            {/* SININHO DE NOTIFICAÇÃO */}
                            <NotificationBell notifications={notifications} />
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        {stats.role === "ADMIN" && stats.isBarber && (
                            <div className="bg-[#1A1B1F] p-1 rounded-lg border border-secondary flex gap-1 h-11 md:h-10">
                                <Button variant={viewMode === "shop" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("shop")} className="flex-1 text-xs gap-2"><Store size={14} /> Barberia</Button>
                                <Button variant={viewMode === "personal" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("personal")} className="flex-1 text-xs gap-2"><User size={14} /> Individual</Button>
                            </div>
                        )}
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                            {viewMode === "personal" ? (
                                <>
                                    <Button variant="outline" className="border-secondary h-11 text-xs" asChild><Link href="/admin/my-schedule"><CalendarCheck2 size={16} className="mr-2 text-primary" /> Agenda</Link></Button>
                                    <Button variant="outline" className="border-secondary h-11 text-xs" asChild><Link href="/admin/my-hours"><Settings2 size={16} className="mr-2 text-primary" /> Horários</Link></Button>
                                    <Button variant={isStaffActive ? "destructive" : "default"} size="sm" onClick={() => setIsConfirmOpen(true)} className={`h-11 col-span-2 sm:col-auto text-xs font-semibold ${!isStaffActive && 'bg-green-600'}`}><Power size={16} className="mr-2" /> {isStaffActive ? "Inativar" : "Ativar"}</Button>
                                </>
                            ) : (
                                <Button variant="outline" asChild className="h-11 w-full sm:w-auto text-xs border-secondary"><Link href="/admin/settings">Configurações</Link></Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KpiCard title={viewMode === "personal" ? "Meus Resultados" : "Faturamento da Barbearia"} icon={DollarSign} value={viewMode === "personal" ? stats.personalKpi.revenue : stats.kpi.revenue} isMoney />
                    <KpiCard title="Minha Agenda" icon={CalendarIcon} value={viewMode === "personal" ? stats.personalKpi.bookings : stats.kpi.bookings} />
                    <KpiCard title="Agenda Hoje" icon={Users} value={viewMode === "personal" ? stats.personalKpi.today : stats.kpi.today} sub="Clientes agendados" />
                    <KpiCard title="Status" icon={ShieldCheck} value={viewMode === "personal" ? (isStaffActive ? "Ativo" : "Inativo") : (stats.kpi.isClosed ? "Fechada" : "Aberta")} />
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
                    <Card className="col-span-1 md:col-span-4 bg-[#1A1B1F] border-none"><CardHeader><CardTitle className="text-white">Produtividade</CardTitle></CardHeader><CardContent><AdminOverviewChart data={viewMode === "personal" ? stats.personalChartData : stats.chartData} /></CardContent></Card>
                    <Card className="col-span-1 md:col-span-3 bg-[#1A1B1F] border-none"><CardHeader><CardTitle className="text-white">Próximos Clientes</CardTitle></CardHeader><CardContent><AdminBookingList bookings={viewMode === "personal" ? stats.personalBookings : stats.bookings} /></CardContent></Card>
                </div>
            </div>
            <Footer />
            <ConfirmDialog isOpen={isConfirmOpen} onOpenChange={setIsConfirmOpen} title={isStaffActive ? "Pausar atendimento?" : "Reativar?"} onConfirm={async () => { await toggleStaffStatus(stats.barberId, !isStaffActive); load(); setIsConfirmOpen(false); }} variant={isStaffActive ? "destructive" : "default"} description={isStaffActive
                ? "Ao inativar, seu perfil não aparecerá mais para novos agendamentos e sua agenda ficará bloqueada."
                : "Ao reativar, os clientes poderão agendar horários com você novamente através do portal."
            } />
        </div>
    )
}

function NotificationBell({ notifications }: { notifications: any[] }) {
    const unread = notifications.filter(n => n.status === "WAITING_CANCELLATION").length
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-secondary rounded-full">
                    <Bell size={20} className="text-gray-400" />
                    {unread > 0 && <span className="absolute top-1.5 right-1.5 flex h-4 w-4"><span className="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative flex rounded-full h-4 w-4 bg-primary text-[10px] items-center justify-center font-bold">{unread}</span></span>}
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#141518] border-l border-white/5 text-white w-full sm:max-w-md">
                <SheetHeader className="mb-6"><SheetTitle className="text-white">Notificações</SheetTitle></SheetHeader>
                <div className="space-y-4">
                    {notifications.map(n => (
                        <Link key={n.id} href="/admin/my-schedule" className="block p-4 rounded-2xl bg-[#1A1B1F] border border-white/5 hover:border-primary/30 transition-all">
                            <div className="flex gap-4">
                                <div className={`p-2 rounded-xl h-fit ${n.status === 'WAITING_CANCELLATION' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>{n.status === 'WAITING_CANCELLATION' ? <XCircle size={18} /> : <CalendarPlus size={18} />}</div>
                                <div><p className="text-sm font-medium leading-tight">{n.status === 'WAITING_CANCELLATION' ? `Solicitação de cancelamento: ${n.user.name}` : `Agendamento para hoje: ${n.user.name}`}</p><p className="text-[10px] text-gray-500 mt-1 uppercase">{format(new Date(n.date), "dd MMM 'às' HH:mm", { locale: ptBR })}</p></div>
                            </div>
                        </Link>
                    ))}
                    {notifications.length === 0 && <div className="text-center py-20 text-gray-600"><Bell size={40} className="mx-auto mb-2 opacity-10" /><p className="text-sm">Tudo em ordem!</p></div>}
                </div>
            </SheetContent>
        </Sheet>
    )
}

function KpiCard({ title, icon: Icon, value, sub, isMoney }: any) {
    return (
        <Card className="bg-[#1A1B1F] border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle><Icon className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{isMoney && typeof value === 'number' ? Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value) : value}</div>{sub && <p className="text-xs text-gray-500">{sub}</p>}</CardContent></Card>
    )
}