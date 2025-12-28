"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "../../_components/header"
import {
    Card, CardContent, CardHeader, CardTitle,
    Button, Badge, Skeleton
} from "@barbergo/ui"
import {
    ChevronLeft, CreditCard, Calendar,
    MessageCircle, ShieldCheck, AlertCircle,
    Clock, CheckCircle2, ChevronRight, FileText
} from "lucide-react"
import Link from "next/link"
import { getBarbershopSubscription } from "../../_actions/get-subscription"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Footer from "@/_components/footer"
import { toast } from "sonner"
import { InvoiceDetails } from "../_components/invoice-details"
import { PLANS, PlanType } from "@barbergo/shared"

export default function BillingPage() {
    const router = useRouter()
    const [subscription, setSubscription] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getBarbershopSubscription()
                setSubscription(data)
            } catch (error) {
                toast.error("Erro ao carregar dados financeiros.")
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [])

    const handleContactSupport = () => {
        const message = encodeURIComponent(`Olá, sou administrador de barbearia na BarberGo e preciso de suporte com meu faturamento.`)
        window.open(`https://wa.me/558421335813?text=${message}`, "_blank")
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-white">
                <Header />
                <div className="container mx-auto p-4 md:p-8 space-y-6">
                    <Skeleton className="h-10 w-48 bg-white/5" />
                    <Skeleton className="h-[300px] w-full bg-white/5 rounded-2xl" />
                </div>
            </div>
        )
    }

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
            icon: ShieldCheck
        },
    }

    const currentStatus = statusMap[subscription?.status as keyof typeof statusMap] || statusMap.TRIAL

    // Função para formatar moeda
    const formatCurrency = (value: any) => {
        return Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(Number(value || 0))
    }

    const currentPlanId = (subscription?.plan as PlanType) || PlanType.PRO
    const planDetails = PLANS[currentPlanId] || PLANS[PlanType.PRO]

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">
            <Header />

            <div className="container mx-auto p-4 md:p-8 space-y-8 flex-1 max-w-4xl">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-secondary rounded-full">
                        <Link href="/admin"><ChevronLeft size={24} /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Assinatura</h1>
                        <p className="text-muted-foreground text-sm">Gerencie seu plano e suporte</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 bg-[#1A1B1F] border-none shadow-2xl ring-1 ring-white/5 overflow-hidden">
                        <div className={`h-1.5 w-full ${currentStatus.accent}`} />
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <CreditCard size={20} className="text-primary" />
                                Detalhes do Plano
                            </CardTitle>
                            <Badge className={`${currentStatus.badge} border-none font-bold px-3 py-1`}>
                                <currentStatus.icon size={12} className="mr-1.5" />
                                {currentStatus.label}
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Plano Atual</p>
                                    <p className="text-xl font-bold text-white uppercase italic">{planDetails.name || subscription?.plan}</p>
                                    <p className="text-xs text-gray-400 mt-1">{planDetails.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <Badge variant="outline" className="text-[10px] border-white/10 text-gray-400">
                                            {planDetails.maxProfessionals === Infinity ? '∞ Profissionais' : `Até ${planDetails.maxProfessionals} prof.`}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Valor Mensal</p>
                                    <p className="text-xl font-bold text-white">
                                        {formatCurrency(subscription?.price)}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Calendar className="text-primary" size={20} />
                                    <div>
                                        <p className="text-xs text-gray-400">Próximo Vencimento</p>
                                        <p className="font-bold">
                                            {subscription?.endDate ? format(new Date(subscription.endDate), "dd 'de' MMMM", { locale: ptBR }) : "Não definido"}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="text-xs h-8 border-primary/20 text-primary hover:bg-primary/10"
                                    disabled // Desabilitado pois "Ver Fatura" agora deve ser no histórico, ou lógica para ver "próxima"? Deixaremos disabled ou removido se não tiver invoice pendente.
                                >
                                    Ver Detalhes
                                </Button>
                            </div>

                            {subscription?.status === 'PAST_DUE' && (
                                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                                    <p className="text-xs text-red-200">
                                        Identificamos uma pendência em sua assinatura. Regularize para evitar a suspensão automática do sistema em 3 dias.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-none ring-1 ring-primary/20 shadow-xl flex flex-col justify-between p-6 rounded-2xl">
                        <div className="space-y-4">
                            <div className="p-3 bg-primary/10 rounded-2xl w-fit text-primary">
                                <MessageCircle size={28} />
                            </div>
                            <h3 className="text-lg font-bold">Precisa de Ajuda?</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Nosso time de suporte está disponível para te ajudar com dúvidas financeiras, upgrade de plano ou problemas técnicos.
                            </p>
                        </div>
                        <Button
                            onClick={handleContactSupport}
                            className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl transition-all active:scale-95 gap-2"
                        >
                            <MessageCircle size={18} />
                            Falar com Suporte
                        </Button>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h2 className="text-sm uppercase font-black text-gray-500 tracking-widest">Histórico de Pagamentos</h2>
                    <div className="space-y-3">
                        {subscription?.invoices?.length > 0 ? (
                            subscription.invoices.map((invoice: any) => (
                                <div
                                    key={invoice.id}
                                    onClick={() => setSelectedInvoice(invoice)}
                                    className="flex items-center justify-between p-4 bg-[#1A1B1F] rounded-2xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${invoice.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`}>
                                            {invoice.status === 'PAID' ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold flex items-center gap-2">
                                                Fatura #{invoice.reference || invoice.id.slice(0, 6)}
                                                <span className="text-[10px] text-gray-500 font-normal uppercase hidden md:inline-block">
                                                    {invoice.method}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-gray-400 uppercase">
                                                {invoice.createdAt ? format(new Date(invoice.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "-"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-sm">{formatCurrency(invoice.amount)}</p>
                                            <Badge className={`text-[9px] px-1.5 h-4 border-none ${invoice.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {invoice.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                                            </Badge>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-600 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-gray-500">
                                <p>Nenhuma fatura encontrada.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <InvoiceDetails
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                invoice={selectedInvoice}
                barbershopName="Minha Barbearia"
            />

            <Footer />
        </div>
    )
}