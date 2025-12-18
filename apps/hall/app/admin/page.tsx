import { getAdminDashboard } from "../_actions/get-admin-dashboard"
import Header from "../_components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@barbergo/ui"
import { CalendarIcon, DollarSign, Users, Eye, Lock, ShieldCheck, User } from "lucide-react"

import { Button } from "@barbergo/ui"
import Link from "next/link"
import AdminOverviewChart from "./_components/admin-overview-chart"
import AdminBookingList from "./_components/admin-booking-list"

export default async function AdminPage() {
    // A action já cuida da segurança e redirecionamento se não for auth
    const stats = await getAdminDashboard()

    const isAdmin = stats.role === "ADMIN"

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <div className="container mx-auto p-6 space-y-8">

                {/* CABEÇALHO DO PAINEL */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Painel {isAdmin ? "Administrativo" : "do Parceiro"}
                            <span className={`text-xs px-2 py-1 rounded border ${isAdmin ? "border-primary text-primary" : "border-green-500 text-green-500"}`}>
                                {isAdmin ? "DONO" : "STAFF"}
                            </span>
                        </h2>
                        <p className="text-muted-foreground">
                            {isAdmin
                                ? "Visão geral do seu negócio."
                                : "Gerencie seus agendamentos e acompanhe seu desempenho."}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {/* Apenas ADMIN pode fechar a loja */}
                        {isAdmin && (
                            <div className={`px-4 py-2 rounded-full border ${stats.kpi.isClosed ? "bg-red-500/10 border-red-500 text-red-500" : "bg-green-500/10 border-green-500 text-green-500"} flex items-center gap-2 font-bold text-xs`}>
                                <Lock size={14} />
                                {stats.kpi.isClosed ? "LOJA FECHADA" : "LOJA ABERTA"}
                            </div>
                        )}

                        {/* Botão de Configurações - Visível para ambos, mas com conteúdo limitado para Staff */}
                        <Button variant="outline" asChild>
                            <Link href="/admin/settings">
                                {isAdmin ? "Gerenciar Barbearia" : "Meus Dados"}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* KPIs (ADAPTATIVOS) */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Ambos veem Faturamento e Agendamentos (mas o Staff vê só o dele) */}
                    <KpiCard
                        title={isAdmin ? "Faturamento da Loja" : "Minha Comissão (Est.)"}
                        icon={DollarSign}
                        value={stats.kpi.revenue}
                        isMoney
                    />
                    <KpiCard
                        title="Agendamentos Mês"
                        icon={CalendarIcon}
                        value={stats.kpi.bookings}
                    />
                    <KpiCard
                        title="Agenda Hoje"
                        icon={Users}
                        value={stats.kpi.today}
                        sub="Clientes agendados"
                    />

                    {/* Card Exclusivo do Admin */}
                    {isAdmin ? (
                        <KpiCard
                            title="Visualizações"
                            icon={Eye}
                            value={stats.kpi.views}
                            sub="Acessos na página"
                        />
                    ) : (
                        <KpiCard
                            title="Status"
                            icon={ShieldCheck}
                            value="Ativo"
                            sub="Conta verificada"
                        />
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-7">
                    {/* GRÁFICO (4 cols) */}
                    <Card className="col-span-4 bg-[#1A1B1F] border-none">
                        <CardHeader>
                            <CardTitle>{isAdmin ? "Receita da Loja" : "Meu Desempenho"} (30 dias)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <AdminOverviewChart data={stats.chartData} />
                        </CardContent>
                    </Card>

                    {/* AGENDA (3 cols) */}
                    <Card className="col-span-3 bg-[#1A1B1F] border-none">
                        <CardHeader>
                            <CardTitle>Próximos Clientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AdminBookingList bookings={stats.bookings} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function KpiCard({ title, icon: Icon, value, sub, isMoney }: any) {
    return (
        <Card className="bg-[#1A1B1F] border-none">
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