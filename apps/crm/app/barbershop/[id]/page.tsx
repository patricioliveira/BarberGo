import { db } from "@barbergo/database"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Label } from "@barbergo/ui"
import { ChevronLeft, ShieldAlert, CheckCircle, Ban, CreditCard, History, Calendar } from "lucide-react"
import Link from "next/link"
import { confirmPaymentAndActivate, markAsPastDue, suspendAccess } from "../../_actions/subscriptions"

export default async function ManageBarbershopPage({ params }: { params: { id: string } }) {
    // 1. Busca os dados da Barbearia, Assinatura e Histórico (Invoices)
    const shop = await db.barbershop.findUnique({
        where: { id: params.id },
        include: {
            subscription: {
                include: { invoices: { orderBy: { createdAt: 'desc' } } }
            },
            owner: true
        }
    })

    if (!shop) return notFound()

    const subscription = shop.subscription!

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 text-white">
            <Button variant="ghost" asChild className="gap-2">
                <Link href="/"><ChevronLeft size={16} /> Voltar ao Dashboard</Link>
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                        {shop.name}
                    </h1>
                    <p className="text-gray-500 font-medium">Gestor: {shop.owner?.name} • {shop.owner?.email}</p>
                </div>
                <Badge className={`font-black border-none px-4 py-1 ${subscription.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' :
                        subscription.status === 'PAST_DUE' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                    {subscription.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ações de Controle */}
                <Card className="bg-secondary border-none ring-1 ring-white/5 lg:col-span-1">
                    <CardHeader><CardTitle className="text-xs uppercase font-black text-gray-500">Controle de Acesso</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {/* Como estamos em Server Component, usamos o bind para passar os parâmetros para a action */}
                        <form action={confirmPaymentAndActivate.bind(null, subscription.id, Number(subscription.price), "PIX")}>
                            <Button type="submit" className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700 font-bold">
                                <CheckCircle size={18} /> Confirmar Pagamento / Ativar
                            </Button>
                        </form>

                        <form action={markAsPastDue.bind(null, subscription.id)}>
                            <Button type="submit" variant="outline" className="w-full justify-start gap-2 border-amber-500 text-amber-500 font-bold">
                                <ShieldAlert size={18} /> Marcar Inadimplência (Aviso)
                            </Button>
                        </form>

                        <form action={suspendAccess.bind(null, subscription.id)}>
                            <Button type="submit" variant="destructive" className="w-full justify-start gap-2 font-bold">
                                <Ban size={18} /> Bloquear Acesso Imediatamente
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Resumo Financeiro */}
                <Card className="bg-secondary border-none ring-1 ring-white/5 lg:col-span-1">
                    <CardHeader><CardTitle className="text-xs uppercase font-black text-gray-500">Dados Financeiros</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[10px] text-gray-500 uppercase">Valor Plano</Label>
                                <p className="text-xl font-bold text-primary">R$ {Number(subscription.price).toFixed(2)}</p>
                            </div>
                            <div>
                                <Label className="text-[10px] text-gray-500 uppercase">Próximo Vencimento</Label>
                                <p className="text-sm font-mono font-bold">
                                    {subscription.endDate?.toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 space-y-2 text-xs text-gray-400">
                            <p className="flex justify-between">Tipo de Faturamento: <span className="text-white font-bold">{subscription.billingType || "PÓS-PAGO"}</span></p>
                            <p className="flex justify-between">Dias de Trial: <span className="text-white font-bold">{subscription.trialDays || 7} dias</span></p>
                        </div>
                    </CardContent>
                </Card>

                {/* Histórico de Pagamentos (Invoices) */}
                <Card className="bg-secondary border-none ring-1 ring-white/5 lg:col-span-1">
                    <CardHeader><CardTitle className="text-xs uppercase font-black text-gray-500 flex items-center gap-2"><History size={14} /> Histórico Recente</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[300px] overflow-y-auto px-6 pb-6 space-y-3">
                            {subscription.invoices?.map((invoice) => (
                                <div key={invoice.id} className="p-3 bg-black/20 rounded-xl border border-white/5 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold">{invoice.reference}</p>
                                        <p className="text-[10px] text-gray-500">{invoice.paidAt?.toLocaleDateString('pt-BR')} • {invoice.method}</p>
                                    </div>
                                    <Badge className="bg-green-500/10 text-green-500 text-[10px] border-none">PAGO</Badge>
                                </div>
                            ))}
                            {subscription.invoices?.length === 0 && (
                                <p className="text-center text-xs text-gray-600 py-10 italic">Nenhum pagamento registrado.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}