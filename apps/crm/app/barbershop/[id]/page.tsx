// apps/hall/app/admin/manage-barbershop/[id]/page.tsx
import { db } from "@barbergo/database"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Label } from "@barbergo/ui"
import { ChevronLeft, ShieldAlert, CheckCircle, Ban, CreditCard, History, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { SubscriptionSubmitButton } from "./_components/submit-button"
import { confirmPaymentAndActivate, markAsPastDue, suspendAccess } from "@/app/_actions/subscriptions"
import { ActivateSubscriptionDialog } from "./_components/activate-subscription-dialog"


const statusMap = {
    TRIAL: {
        label: "Período de Teste",
        badge: "bg-blue-500/10 text-blue-500",
        accent: "bg-blue-500",
        icon: Clock
    },
    ACTIVE: {
        label: "Assinatura Ativa",
        badge: "bg-green-500/10 text-green-500",
        accent: "bg-green-500",
        icon: CheckCircle2
    },
    PAST_DUE: {
        label: "Pagamento Pendente",
        badge: "bg-amber-500/10 text-amber-500",
        accent: "bg-amber-500",
        icon: AlertCircle
    },
    SUSPENDED: {
        label: "Acesso Suspenso",
        badge: "bg-red-500/10 text-red-500",
        accent: "bg-red-500",
        icon: Ban
    },
}

export default async function ManageBarbershopPage({ params }: { params: { id: string } }) {
    const shop = await db.barbershop.findUnique({
        where: { id: params.id },
        include: {
            subscription: {
                include: { invoices: { orderBy: { createdAt: 'desc' } } }
            },
            owner: true
        }
    })

    if (!shop || !shop.subscription) return notFound()

    const subscription = shop.subscription
    const currentStatus = statusMap[subscription.status as keyof typeof statusMap] || statusMap.TRIAL

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 text-white">
            <Button variant="ghost" asChild className="gap-2 hover:bg-white/5">
                <Link href="/"><ChevronLeft size={16} /> Voltar ao Painel</Link>
            </Button>

            {/* HEADER COM LÓGICA DE CORES */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                        {shop.name}
                    </h1>
                    <p className="text-gray-500 font-medium italic">Gestor: {shop.owner?.name} • {shop.owner?.email}</p>
                </div>
                <Badge className={`font-black border-none px-4 py-1 flex items-center gap-2 ${currentStatus.badge}`}>
                    <currentStatus.icon size={14} />
                    {subscription.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Ações de Controle com Loading */}
                <Card className="bg-[#1A1B1F] border-none ring-1 ring-white/5 lg:col-span-1 overflow-hidden">
                    <div className={`h-1 w-full ${currentStatus.accent}`} />
                    <CardHeader><CardTitle className="text-xs uppercase font-black text-gray-500">Controle de Assinatura</CardTitle></CardHeader>
                    <CardContent className="space-y-3">

                        {/* NOVO COMPONENTE COM MODAL */}
                        <ActivateSubscriptionDialog
                            subscriptionId={subscription.id}
                            defaultPrice={Number(subscription.price)}
                        />

                        {/* MANTÉM OS OUTROS QUE SÃO DISPAROS DIRETOS */}
                        <form action={markAsPastDue.bind(null, subscription.id)}>
                            <SubscriptionSubmitButton
                                variant="outline"
                                className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                                icon={<ShieldAlert size={18} />}
                                label="Marcar Inadimplência"
                            />
                        </form>

                        <form action={suspendAccess.bind(null, subscription.id)}>
                            <SubscriptionSubmitButton
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700"
                                icon={<Ban size={18} />}
                                label="Bloquear Acesso Agora"
                            />
                        </form>
                    </CardContent>
                </Card>
                {/* Resumo Financeiro */}
                <Card className="bg-[#1A1B1F] border-none ring-1 ring-white/5 lg:col-span-1 overflow-hidden">
                    <div className={`h-1 w-full ${currentStatus.accent}`} />
                    <CardHeader><CardTitle className="text-xs uppercase font-black text-gray-500">Dados Financeiros</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[10px] text-gray-500 uppercase font-bold">Valor Mensal</Label>
                                <p className="text-xl font-black text-white">
                                    {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(subscription.price))}
                                </p>
                            </div>
                            <div>
                                <Label className="text-[10px] text-gray-500 uppercase font-bold">Vencimento</Label>
                                <p className="text-sm font-mono font-bold text-gray-200">
                                    {subscription.endDate?.toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 space-y-2 text-xs text-gray-400">
                            <p className="flex justify-between">Plano: <span className="text-white font-bold italic">PRO</span></p>
                            <p className="flex justify-between">Tipo: <span className="text-white font-bold">{subscription.billingType || "RECORRENTE"}</span></p>
                        </div>
                    </CardContent>
                </Card>

                {/* Histórico Recente */}
                <Card className="bg-[#1A1B1F] border-none ring-1 ring-white/5 lg:col-span-1 overflow-hidden">
                    <div className={`h-1 w-full ${currentStatus.accent}`} />
                    <CardHeader><CardTitle className="text-xs uppercase font-black text-gray-500 flex items-center gap-2"><History size={14} /> Faturas Pagas</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[300px] overflow-y-auto px-6 pb-6 space-y-3">
                            {subscription.invoices?.map((invoice) => (
                                <div key={invoice.id} className="p-3 bg-black/20 rounded-xl border border-white/5 flex justify-between items-center group hover:border-green-500/30 transition-all">
                                    <div>
                                        <p className="text-xs font-bold text-gray-200">{invoice.reference}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">{invoice.paidAt?.toLocaleDateString('pt-BR')} • {invoice.method}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <Badge className="bg-green-500/10 text-green-500 text-[9px] border-none font-black">PAGO</Badge>
                                        <p className="text-[10px] font-mono mt-1">R$ {Number(invoice.amount).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                            {subscription.invoices?.length === 0 && (
                                <p className="text-center text-xs text-gray-600 py-10 italic">Nenhuma fatura encontrada.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}