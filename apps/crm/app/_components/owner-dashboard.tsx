// apps/crm/app/_components/owner-dashboard.tsx

import { db } from "@barbergo/database"
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@barbergo/ui"
import { Store, DollarSign, TrendingUp, ArrowRight, User, Users, Percent, Trash2, Power } from "lucide-react"
import Link from "next/link"
import { AddBarbershopDialog } from "./add-barbershop-dialog";
import { AddPartnerDialog } from "./add-partner-dialog";
import { LogoutButton } from "./logout-button";
import { PartnersTable } from "./partners-table";

export default async function OwnerDashboard() {
    // Busca Clientes e Parceiros
    const barbershops = await db.barbershop.findMany({
        include: { subscription: true, owner: true, referredBy: true }
    })

    const partners = await db.user.findMany({
        where: { role: "PARTNER" },
        include: { referredBarbershops: { include: { subscription: true } } }
    })

    // Cálculos de Clientes
    const totalMRR = barbershops.reduce((acc, shop) => acc + Number(shop.subscription?.price || 0), 0)
    const annualProjetion = totalMRR * 12
    const trialCount = barbershops.filter(s => s.subscription?.status === 'TRIAL').length

    // Cálculos de Parceiros
    const totalCommission = partners.reduce((acc, partner) => {
        const partnerRevenue = partner.referredBarbershops
            .filter(s => s.subscription?.status === 'ACTIVE')
            .reduce((sum, s) => sum + Number(s.subscription?.price || 0), 0)
        return acc + (partnerRevenue * Number(partner.commissionPercentage || 0)) / 100
    }, 0)

    return (
        // Ajuste de padding: p-4 no mobile, p-8 no desktop
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto text-white">

            {/* HEADER RESPONSIVO OTIMIZADO */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                {/* Topo: Marca e Logout lado a lado no Mobile */}
                <div className="flex items-start justify-between w-full sm:w-auto">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase leading-none">
                            BarberGo <span className="text-primary">CRM</span>
                        </h1>
                        <p className="text-gray-500 text-[10px] md:text-sm font-bold uppercase tracking-widest">
                            Gestão Estratégica
                        </p>
                    </div>

                    {/* Logout visível no topo direito apenas no Mobile */}
                    <div className="sm:hidden">
                        <LogoutButton />
                    </div>
                </div>

                {/* Ações: Botões de Adicionar */}
                <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:items-center">
                    {/* Logout no Desktop (escondido no mobile aqui para evitar duplicidade) */}
                    <div className="hidden sm:block">
                        <LogoutButton />
                    </div>

                    {/* Grade de botões: 2 colunas no mobile, flex no desktop */}
                    <div className="grid grid-cols-2 sm:flex gap-2">
                        <AddPartnerDialog />
                        <AddBarbershopDialog partners={partners} />
                    </div>
                </div>
            </div>

            {/* KPIs FINANCEIROS: 1 col no mobile, 2 em tablets, 4 no desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="MRR Mensal" value={totalMRR} isMoney icon={DollarSign} color="text-green-500" />
                <KpiCard title="Projeção ARR" value={annualProjetion} isMoney icon={TrendingUp} color="text-primary" />
                <KpiCard title="Comissões" value={totalCommission} isMoney icon={Percent} color="text-amber-500" />
                <KpiCard title="Trial Ativos" value={trialCount} icon={ArrowRight} color="text-blue-500" />
            </div>

            <Tabs defaultValue="clients" className="space-y-6">
                {/* Tabs que ocupam a largura total no mobile */}
                <TabsList className="bg-secondary border border-white/5 p-1 w-full justify-start sm:w-auto">
                    <TabsTrigger value="clients" className="flex-1 sm:flex-none gap-2">
                        <Store size={14} /> Clientes
                    </TabsTrigger>
                    <TabsTrigger value="partners" className="flex-1 sm:flex-none gap-2">
                        <Users size={14} /> Parceiros
                    </TabsTrigger>
                </TabsList>

                {/* ABA DE CLIENTES */}
                <TabsContent value="clients">
                    <Card className="bg-secondary border-none shadow-2xl ring-1 ring-white/5 overflow-hidden rounded-[24px] md:rounded-[32px]">
                        <CardHeader className="p-5 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/20">
                            <CardTitle className="text-lg md:text-xl font-bold">Carteira de Clientes</CardTitle>
                            <div className="flex flex-wrap gap-2">
                                <Badge className="bg-primary/10 text-primary border-none text-[10px]">PRO: {barbershops.filter(b => b.subscription?.plan === 'PRO').length}</Badge>
                                <Badge className="bg-purple-500/10 text-purple-500 border-none text-[10px]">PREMIUM: {barbershops.filter(b => b.subscription?.plan === 'PREMIUM').length}</Badge>
                            </div>
                        </CardHeader>

                        {/* Scroll horizontal apenas na tabela para não quebrar o layout */}
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-black/40 text-[10px] uppercase font-black text-gray-500">
                                    <tr>
                                        <th className="px-4 py-4 md:px-6 md:py-6">Unidade / Dono</th>
                                        <th className="px-4 py-4 md:px-6 md:py-6">Indicado</th>
                                        <th className="px-4 py-4 md:px-6 md:py-6 text-center">Status</th>
                                        <th className="px-4 py-4 md:px-6 md:py-6">Ticket</th>
                                        <th className="px-4 py-4 md:px-6 md:py-6 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {barbershops.map(shop => (
                                        <tr key={shop.id} className="border-t border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="px-4 py-4 md:px-6 md:py-6">
                                                <p className="font-bold text-white group-hover:text-primary transition-colors uppercase truncate max-w-[150px]">{shop.name}</p>
                                                <p className="text-[10px] text-gray-500 flex items-center gap-1 font-medium italic"><User size={10} /> {shop.owner?.name || 'Sem dono'}</p>
                                            </td>
                                            <td className="px-4 py-4 md:px-6 md:py-6 text-xs text-gray-400">
                                                {shop.referredBy?.name || "Direto"}
                                            </td>
                                            <td className="px-4 py-4 md:px-6 md:py-6 text-center">
                                                <Badge className={`font-black border-none text-[9px] px-2 py-0.5 ${shop.subscription?.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' :
                                                        shop.subscription?.status === 'PAST_DUE' ? 'bg-red-500/10 text-red-500' :
                                                            shop.subscription?.status === 'SUSPENDED' ? 'bg-red-600 text-white' :
                                                                'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                    {shop.subscription?.status || 'TRIAL'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 md:px-6 md:py-6 font-mono font-bold text-primary text-xs md:text-sm">
                                                R$ {Number(shop.subscription?.price || 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-4 md:px-6 md:py-6 text-right">
                                                <Button size="sm" variant="secondary" className="h-8 rounded-lg font-bold text-[10px] md:text-xs" asChild>
                                                    <Link href={`/barbershop/${shop.id}`}>ABRIR</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="partners">
                    <Card className="bg-secondary border-none shadow-2xl ring-1 ring-white/5 overflow-hidden rounded-[24px] md:rounded-[32px]">
                        <CardHeader className="p-5 md:p-8 border-b border-white/5 bg-black/20">
                            <CardTitle className="text-lg md:text-xl font-bold">Gestão de Parceiros</CardTitle>
                        </CardHeader>
                        <PartnersTable partners={partners} />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function KpiCard({ title, value, isMoney, icon: Icon, color }: any) {
    return (
        <Card className="bg-secondary border-none ring-1 ring-white/5 shadow-xl transition-transform active:scale-95">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</CardTitle>
                <Icon size={14} className={color || "text-gray-400"} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className={`text-xl md:text-2xl font-bold ${color || "text-white"}`}>
                    {isMoney ? Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value) : value}
                </div>
            </CardContent>
        </Card>
    )
}