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
    Clock, CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { getBarbershopSubscription } from "../../_actions/get-subscription"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Footer from "@/_components/footer"
import { toast } from "sonner"

export default function BillingPage() {
    const router = useRouter()
    const [subscription, setSubscription] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

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
        const message = encodeURIComponent("Olá, sou administrador na BarberGo e preciso de suporte com meu faturamento.")
        window.open(`https://wa.me/5599999999999?text=${message}`, "_blank")
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
        TRIAL: { label: "Período de Teste", color: "bg-amber-500/10 text-amber-500", icon: Clock },
        ACTIVE: { label: "Assinatura Ativa", color: "bg-green-500/10 text-green-500", icon: CheckCircle2 },
        PAST_DUE: { label: "Pagamento Pendente", color: "bg-red-500/10 text-red-500", icon: AlertCircle },
        SUSPENDED: { label: "Acesso Suspenso", color: "bg-red-600 text-white", icon: ShieldCheck },
    }

    const currentStatus = statusMap[subscription?.status as keyof typeof statusMap] || statusMap.TRIAL

    // Função para formatar moeda
    const formatCurrency = (value: any) => {
        return Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(Number(value || 0))
    }

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
                        <p className="text-muted-foreground text-sm">Gerencie seu plano SaaS e suporte</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 bg-[#1A1B1F] border-none shadow-2xl ring-1 ring-white/5 overflow-hidden">
                        <div className={`h-1.5 w-full ${currentStatus.color.split(' ')[1].replace('text-', 'bg-')}`} />
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <CreditCard size={20} className="text-primary" />
                                Detalhes do Plano
                            </CardTitle>
                            <Badge className={`${currentStatus.color} border-none font-bold px-3 py-1`}>
                                <currentStatus.icon size={12} className="mr-1.5" />
                                {currentStatus.label}
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Plano Atual</p>
                                    <p className="text-xl font-bold text-white uppercase italic">{subscription?.plan || "PRO"}</p>
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
                                <Button variant="outline" className="text-xs h-8 border-primary/20 text-primary hover:bg-primary/10">Ver Fatura</Button>
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
                    <h2 className="text-sm uppercase font-black text-gray-500 tracking-widest">Histórico Recente</h2>
                    <div className="flex items-center justify-between p-4 bg-[#1A1B1F] rounded-2xl border border-white/5 opacity-50">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Pagamento Confirmado</p>
                                <p className="text-[10px] text-gray-500 uppercase">Última mensalidade</p>
                            </div>
                        </div>
                        <p className="font-bold text-sm">{formatCurrency(subscription?.price)}</p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}