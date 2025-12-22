import { db } from "@barbergo/database"
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@barbergo/ui"
import { Store, DollarSign, TrendingUp, ArrowRight, User, Users, Percent, Trash2, Power } from "lucide-react"
import Link from "next/link"
import { AddBarbershopDialog } from "./add-barbershop-dialog";
import { AddPartnerDialog } from "./add-partner-dialog";

export default async function OwnerDashboard() {
    // Busca Clientes e Parceiros
    const barbershops = await db.barbershop.findMany({
        include: { subscription: true, owner: true, referredBy: true }
    })

    const partners = await db.user.findMany({
        where: { role: "PARTNER" },
        include: { referredBarbershops: { include: { subscription: true } } }
    })

    // Cálculos de Clientes (Seu código base)
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
        <div className="p-8 space-y-8 max-w-7xl mx-auto text-white">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter italic">BarberGo <span className="text-primary">CENTRAL</span></h1>
                    <p className="text-gray-500 font-medium">Gestão Estratégica da SoftHouse</p>
                </div>
                <div className="flex gap-3">
                    <AddPartnerDialog />
                    <AddBarbershopDialog />
                </div>
            </div>

            {/* KPIs FINANCEIROS (Seu código base + Comissão) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KpiCard title="Faturamento Mensal (MRR)" value={totalMRR} isMoney icon={DollarSign} color="text-green-500" />
                <KpiCard title="Projeção Anual (ARR)" value={annualProjetion} isMoney icon={TrendingUp} color="text-primary" />
                <KpiCard title="Total Comissões" value={totalCommission} isMoney icon={Percent} color="text-amber-500" />
                <KpiCard title="Em Período Trial" value={trialCount} icon={ArrowRight} color="text-blue-500" />
            </div>

            <Tabs defaultValue="clients" className="space-y-6">
                <TabsList className="bg-secondary border border-white/5 p-1">
                    <TabsTrigger value="clients" className="gap-2"><Store size={14} /> Clientes</TabsTrigger>
                    <TabsTrigger value="partners" className="gap-2"><Users size={14} /> Parceiros (Afiliados)</TabsTrigger>
                </TabsList>

                {/* ABA DE CLIENTES (Seu código base integral) */}
                <TabsContent value="clients">
                    <Card className="bg-secondary border-none shadow-2xl ring-1 ring-white/5 overflow-hidden rounded-[32px]">
                        <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between bg-black/20">
                            <CardTitle className="text-xl font-bold">Carteira de Clientes</CardTitle>
                            <div className="flex gap-2">
                                <Badge className="bg-primary/10 text-primary border-none">PRO: {barbershops.filter(b => b.subscription?.plan === 'PRO').length}</Badge>
                                <Badge className="bg-purple-500/10 text-purple-500 border-none">PREMIUM: {barbershops.filter(b => b.subscription?.plan === 'PREMIUM').length}</Badge>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/40 text-[10px] uppercase font-black text-gray-500">
                                    <tr>
                                        <th className="p-6">Unidade / Responsável</th>
                                        <th className="p-6">Indicado por</th>
                                        <th className="p-6">Plano</th>
                                        <th className="p-6">Status Financeiro</th>
                                        <th className="p-6">Ticket</th>
                                        <th className="p-6 text-right">Controle</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {barbershops.map(shop => (
                                        <tr key={shop.id} className="border-t border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="p-6">
                                                <p className="font-bold text-white group-hover:text-primary transition-colors uppercase">{shop.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 font-medium"><User size={10} /> {shop.owner?.name || 'Sem dono'}</p>
                                            </td>
                                            <td className="p-6 text-xs italic text-gray-400">
                                                {shop.referredBy?.name || "Direto"}
                                            </td>
                                            <td className="p-6">
                                                <Badge variant="outline" className={`text-[9px] font-bold ${shop.subscription?.plan === 'PREMIUM' ? 'border-purple-500 text-purple-500' : 'border-gray-600'}`}>
                                                    {shop.subscription?.plan || 'PRO'}
                                                </Badge>
                                            </td>
                                            <td className="p-6">
                                                <Badge className={`font-black border-none text-[10px] ${shop.subscription?.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' :
                                                    shop.subscription?.status === 'PAST_DUE' ? 'bg-red-500/10 text-red-500' :
                                                        shop.subscription?.status === 'SUSPENDED' ? 'bg-red-600 text-white' :
                                                            'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                    {shop.subscription?.status || 'TRIAL'}
                                                </Badge>
                                            </td>
                                            <td className="p-6 font-mono font-bold text-primary">R$ {Number(shop.subscription?.price || 0).toFixed(2)}</td>
                                            <td className="p-6 text-right">
                                                <Button size="sm" variant="secondary" className="rounded-xl font-bold group-hover:bg-primary group-hover:text-white transition-all" asChild>
                                                    <Link href={`/barbershop/${shop.id}`}>GERENCIAR</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                {/* ABA DE PARCEIROS (Novo) */}
                <TabsContent value="partners">
                    <Card className="bg-secondary border-none shadow-2xl ring-1 ring-white/5 overflow-hidden rounded-[32px]">
                        <CardHeader className="p-8 border-b border-white/5 bg-black/20">
                            <CardTitle className="text-xl font-bold">Gestão de Parceiros Indicadores</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/40 text-[10px] uppercase font-black text-gray-500">
                                    <tr>
                                        <th className="p-6">Parceiro</th>
                                        <th className="p-6">Comissão (%)</th>
                                        <th className="p-6">Indicações (Ativas/Total)</th>
                                        <th className="p-6">Total a Pagar</th>
                                        <th className="p-6 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {partners.map(partner => {
                                        const totalReferrals = partner.referredBarbershops.length
                                        const activeReferrals = partner.referredBarbershops.filter(s => s.subscription?.status === 'ACTIVE').length
                                        const revenue = partner.referredBarbershops
                                            .filter(s => s.subscription?.status === 'ACTIVE')
                                            .reduce((sum, s) => sum + Number(s.subscription?.price || 0), 0)
                                        const commission = (revenue * Number(partner.commissionPercentage)) / 100

                                        return (
                                            <tr key={partner.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                                                <td className="p-6">
                                                    <p className="font-bold">{partner.name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase">{partner.email}</p>
                                                </td>
                                                <td className="p-6 font-mono font-bold text-amber-500">{Number(partner.commissionPercentage)}%</td>
                                                <td className="p-6 text-gray-400 font-bold">{activeReferrals} / {totalReferrals}</td>
                                                <td className="p-6 font-mono font-bold text-green-500">R$ {commission.toFixed(2)}</td>
                                                <td className="p-6 text-right space-x-2">
                                                    <Button size="icon" variant="ghost" className={partner.isActive ? "text-green-500" : "text-red-500"} title="Ativar/Inativar">
                                                        <Power size={18} />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-500/10">
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

// Seu componente KpiCard original (Mantido)
function KpiCard({ title, value, isMoney, icon: Icon, color }: any) {
    return (
        <Card className="bg-secondary border-none ring-1 ring-white/5 shadow-xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</CardTitle>
                <Icon size={16} className={color || "text-gray-400"} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color || "text-white"}`}>
                    {isMoney ? Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value) : value}
                </div>
            </CardContent>
        </Card>
    )
}