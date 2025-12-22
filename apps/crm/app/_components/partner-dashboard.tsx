import { Card, CardContent, CardHeader, CardTitle, Badge } from "@barbergo/ui"
import { DollarSign, Users, Percent } from "lucide-react"

export default function PartnerDashboard({ partner }: any) {
    const referrals = partner.referredBarbershops || []

    // Cálculo de comissão (Total de assinaturas ativas * % do parceiro)
    const activeReferrals = referrals.filter((s: any) => s.subscription?.status === 'ACTIVE')
    const totalRevenue = activeReferrals.reduce((acc: number, s: any) => acc + Number(s.subscription?.price || 0), 0)
    const myCommission = (totalRevenue * Number(partner.commissionPercentage)) / 100

    return (
        <div className="p-8 space-y-8 text-white">
            <header>
                <h1 className="text-3xl font-black italic">Olá, {partner.name}</h1>
                <p className="text-gray-500 uppercase text-xs font-bold">Painel do Parceiro • Sua comissão: {partner.commissionPercentage}%</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-secondary border-none ring-1 ring-white/5">
                    <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500 uppercase">Minha Receita Total</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-green-500">R$ {myCommission.toFixed(2)}</div></CardContent>
                </Card>
                <Card className="bg-secondary border-none ring-1 ring-white/5">
                    <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500 uppercase">Indicações Ativas</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{activeReferrals.length} / {referrals.length}</div></CardContent>
                </Card>
            </div>

            <Card className="bg-secondary border-none overflow-hidden rounded-3xl">
                <table className="w-full text-left">
                    <thead className="bg-black/40 text-[10px] uppercase font-black text-gray-400">
                        <tr>
                            <th className="p-6">Barbearia</th>
                            <th className="p-6">Plano</th>
                            <th className="p-6">Status</th>
                            <th className="p-6">Sua Comissão</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {referrals.map((shop: any) => {
                            const shopPrice = Number(shop.subscription?.price || 0)
                            const commission = (shopPrice * Number(partner.commissionPercentage)) / 100
                            return (
                                <tr key={shop.id} className="border-t border-white/5">
                                    <td className="p-6 font-bold">{shop.name}</td>
                                    <td className="p-6 uppercase text-xs font-mono">{shop.subscription?.plan || 'TRIAL'}</td>
                                    <td className="p-6">
                                        <Badge className={shop.subscription?.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                                            {shop.subscription?.status}
                                        </Badge>
                                    </td>
                                    <td className="p-6 font-mono font-bold text-primary">R$ {commission.toFixed(2)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </Card>
        </div>
    )
}