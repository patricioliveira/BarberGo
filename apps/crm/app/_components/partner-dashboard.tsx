// apps/crm/app/_components/partner-dashboard.tsx
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@barbergo/ui"
import { DollarSign, Users, Percent, Store, TrendingUp } from "lucide-react"
import { LogoutButton } from "./logout-button"

export default function PartnerDashboard({ partner }: any) {
    const referrals = partner.referredBarbershops || []

    // Cálculos
    const activeReferrals = referrals.filter((s: any) => s.subscription?.status === 'ACTIVE')
    const totalRevenue = activeReferrals.reduce((acc: number, s: any) => acc + Number(s.subscription?.price || 0), 0)
    const myCommission = (totalRevenue * Number(partner.commissionPercentage)) / 100

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto text-white">
            {/* Header com Identidade e Logout */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter italic uppercase">BarberGo <span className="text-primary">CRM</span></h1>
                    <h2 className="text-2xl font-bold mt-2">Bem-vindo, {partner.name}</h2>
                    <p className="text-gray-500 font-medium">Painel de Afiliado e Parceiro Estratégico</p>
                </div>
                <LogoutButton />
            </div>

            {/* KPIs Financeiros do Parceiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard
                    title="Minha Comissão Total"
                    value={myCommission}
                    isMoney
                    icon={DollarSign}
                    color="text-green-500"
                />
                <KpiCard
                    title="Indicações Ativas"
                    value={`${activeReferrals.length} / ${referrals.length}`}
                    icon={Users}
                    color="text-primary"
                />
                <KpiCard
                    title="Taxa de Comissão"
                    value={`${partner.commissionPercentage}%`}
                    icon={Percent}
                    color="text-amber-500"
                />
            </div>

            {/* Tabela de Indicações */}
            <Card className="bg-secondary border-none shadow-2xl ring-1 ring-white/5 overflow-hidden rounded-[32px]">
                <CardHeader className="p-8 border-b border-white/5 bg-black/20">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Store className="text-primary" size={20} /> Minhas Indicações
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/40 text-[10px] uppercase font-black text-gray-500">
                            <tr>
                                <th className="p-6">Unidade</th>
                                <th className="p-6">Plano</th>
                                <th className="p-6">Status Financeiro</th>
                                <th className="p-6">Minha Comissão</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {referrals.map((shop: any) => {
                                const shopPrice = Number(shop.subscription?.price || 0)
                                const commission = (shopPrice * Number(partner.commissionPercentage)) / 100
                                return (
                                    <tr key={shop.id} className="border-t border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="p-6">
                                            <p className="font-bold text-white group-hover:text-primary transition-colors uppercase">{shop.name}</p>
                                        </td>
                                        <td className="p-6">
                                            <Badge variant="outline" className="border-gray-600 font-mono text-[10px]">
                                                {shop.subscription?.plan || 'TRIAL'}
                                            </Badge>
                                        </td>
                                        <td className="p-6">
                                            <Badge className={`font-black border-none text-[10px] ${shop.subscription?.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {shop.subscription?.status || 'PENDENTE'}
                                            </Badge>
                                        </td>
                                        <td className="p-6 font-mono font-bold text-primary">
                                            R$ {commission.toFixed(2)}
                                        </td>
                                    </tr>
                                )
                            })}
                            {referrals.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-gray-500 italic">
                                        Você ainda não possui indicações registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

function KpiCard({ title, value, isMoney, icon: Icon, color }: any) {
    return (
        <Card className="bg-secondary border-none ring-1 ring-white/5 shadow-xl rounded-2xl">
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