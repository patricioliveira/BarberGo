"use client"

import { useState, useEffect } from "react"
import Header from "../_components/header"
import { Card, CardContent, CardHeader, CardTitle, Button } from "@barbergo/ui"
import {
    CalendarIcon, DollarSign, Users, Eye, Lock, ShieldCheck, User,
    CalendarCheck2, Settings2, Power, Loader2, Store
} from "lucide-react"

import Link from "next/link"
import AdminOverviewChart from "./_components/admin-overview-chart"
import AdminBookingList from "./_components/admin-booking-list"
import { getAdminDashboard } from "../_actions/get-admin-dashboard"
import { ConfirmDialog } from "../_components/confirm-dialog"
import { toggleStaffStatus } from "../_actions/manage-staff"
import { toast } from "sonner"
import router from "next/router"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"

export default async function AdminPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [viewMode, setViewMode] = useState<"shop" | "personal">("shop")
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
        redirect("/")
    }

    useEffect(() => { load() }, [])

    const load = async () => {
        try {
            setIsLoading(true)
            const data = await getAdminDashboard()
            setStats(data)
            if (data.role === "STAFF") setViewMode("personal")
        } catch (error) {
            // Se a Action falhar (ex: Unauthorized), redireciona suavemente para a home
            console.error("Erro de autorização:", error)
            router.push("/")
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading || !stats) return <div className="min-h-screen flex items-center justify-center bg-background text-white"><Loader2 className="animate-spin text-primary" size={40} /></div>

    const isAdmin = stats.role === "ADMIN"
    const isBarber = stats.isBarber
    const showPersonal = viewMode === "personal"

    const handleInactivate = async () => {
        const res = await toggleStaffStatus(stats.barberId, false)
        toast.success("Seu atendimento foi pausado e agenda limpa.")
        load()
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <div className="container mx-auto p-4 md:p-6 space-y-8">

                {/* HEADER COM SELETOR ORGANIZADO E RESPONSIVO */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                            {showPersonal ? "Meu Perfil Individual" : "Painel da Barbearia"}
                            <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${isAdmin ? "border-primary text-primary" : "border-green-500 text-green-500"}`}>
                                {isAdmin ? "DONO" : "STAFF"}
                            </span>
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {showPersonal ? "Gerencie seus horários e atendimentos individuais." : "Visão geral do faturamento e performance da unidade."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        {/* Seletor de Visão (Apenas se Admin for Barbeiro) */}
                        {isAdmin && isBarber && (
                            <div className="bg-[#1A1B1F] p-1 rounded-lg border border-secondary flex gap-1 h-11 md:h-10 shadow-sm">
                                <Button
                                    variant={viewMode === "shop" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("shop")}
                                    className="flex-1 h-full text-xs gap-2 px-4"
                                >
                                    <Store size={14} /> Loja
                                </Button>
                                <Button
                                    variant={viewMode === "personal" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("personal")}
                                    className="flex-1 h-full text-xs gap-2 px-4"
                                >
                                    <User size={14} /> Individual
                                </Button>
                            </div>
                        )}

                        {/* Grupo de Ações - Grid no Mobile, Flex no Desktop */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                            {showPersonal ? (
                                <>
                                    <Button variant="outline" className="border-secondary text-white h-11 md:h-10 text-xs flex-1 sm:flex-none px-4" asChild>
                                        <Link href="/admin/my-schedule">
                                            <CalendarCheck2 size={16} className="mr-2 text-primary" /> Agenda
                                        </Link>
                                    </Button>
                                    <Button variant="outline" className="border-secondary text-white h-11 md:h-10 text-xs flex-1 sm:flex-none px-4" asChild>
                                        <Link href="/admin/my-hours">
                                            <Settings2 size={16} className="mr-2 text-primary" /> Horários
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setIsConfirmOpen(true)}
                                        className="h-11 md:h-10 col-span-2 sm:col-auto text-xs px-4 font-semibold"
                                    >
                                        <Power size={16} className="mr-2" /> Inativar Atendimento
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" asChild className="h-11 md:h-10 w-full sm:w-auto text-xs px-6 font-semibold border-secondary text-white">
                                    <Link href="/admin/settings">
                                        {isAdmin ? "Gerenciar Barbearia" : "Configurações"}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* KPIS */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KpiCard title={showPersonal ? "Meus Resultados" : "Faturamento Loja"} icon={DollarSign} value={showPersonal ? stats.personalKpi.revenue : stats.kpi.revenue} isMoney />
                    <KpiCard title={showPersonal ? "Minha Agenda" : "Agendamentos Mês"} icon={CalendarIcon} value={showPersonal ? stats.personalKpi.bookings : stats.kpi.bookings} />
                    <KpiCard title="Agenda Hoje" icon={Users} value={showPersonal ? stats.personalKpi.today : stats.kpi.today} sub="Clientes agendados" />
                    <KpiCard title="Status" icon={ShieldCheck} value={showPersonal ? (stats.personalKpi.isActive ? "Ativo" : "Inativo") : (stats.kpi.isClosed ? "Fechada" : "Aberta")} />
                </div>

                {/* GRÁFICO E LISTA */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
                    <Card className="col-span-1 md:col-span-4 bg-[#1A1B1F] border-none shadow-md">
                        <CardHeader><CardTitle className="text-white">{showPersonal ? "Minha Produtividade" : "Receita da Loja"}</CardTitle></CardHeader>
                        <CardContent><AdminOverviewChart data={showPersonal ? stats.personalChartData : stats.chartData} /></CardContent>
                    </Card>
                    <Card className="col-span-1 md:col-span-3 bg-[#1A1B1F] border-none shadow-md">
                        <CardHeader><CardTitle className="text-white">{showPersonal ? "Meus Próximos Clientes" : "Geral da Loja"}</CardTitle></CardHeader>
                        <CardContent><AdminBookingList bookings={showPersonal ? stats.personalBookings : stats.bookings} /></CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen} onOpenChange={setIsConfirmOpen}
                title="Deseja se inativar?" description="Seus agendamentos pendentes serão cancelados e você não aparecerá mais nas buscas."
                onConfirm={handleInactivate} variant="destructive"
            />
        </div>
    )
}

function KpiCard({ title, icon: Icon, value, sub, isMoney }: any) {
    return (
        <Card className="bg-[#1A1B1F] border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle><Icon className="h-4 w-4 text-primary" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">{isMoney && typeof value === 'number' ? Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value) : value}</div>{sub && <p className="text-xs text-gray-500">{sub}</p>}</CardContent>
        </Card>
    )
}