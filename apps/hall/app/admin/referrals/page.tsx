"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Header from "@/_components/header"
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@barbergo/ui"
import { ArrowLeft, Loader2, Copy, CheckCircle2, Ticket, Users, Coins } from "lucide-react"
import { getReferrals } from "@/_actions/get-referrals"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function AdminReferralsPage() {
    const router = useRouter()
    const { status } = useSession()
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        if (status === "unauthenticated") router.push("/")
        if (status === "authenticated") {
            const load = async () => {
                try {
                    const res = await getReferrals()
                    setData(res)
                } catch (err) {
                    console.error(err)
                    toast.error("Erro ao carregar indicações.")
                } finally {
                    setIsLoading(false)
                }
            }
            load()
        }
    }, [status, router])

    const copyCode = () => {
        if (data?.referralCode) {
            navigator.clipboard.writeText(data.referralCode)
            toast.success("Código copiado!")
        }
    }

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={40} /></div>

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Header />
            <div className="container mx-auto p-5 md:p-8 max-w-5xl space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/admin")} className="shrink-0 border-secondary"><ArrowLeft size={20} /></Button>
                    <h1 className="text-2xl font-bold text-white">Programa de Indicações</h1>
                </div>

                {/* Banner do Código */}
                <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 opacity-10">
                        <Ticket size={200} />
                    </div>

                    <div className="space-y-2 z-10 text-center md:text-left">
                        <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Indique e Ganhe</h2>
                        <p className="text-gray-400 max-w-md">Envie seu código para outros barbeiros. A cada nova assinatura ativa vinda da sua indicação, você ganha descontos na sua mensalidade!</p>
                    </div>

                    <div className="z-10 bg-black/40 p-1 pl-4 rounded-xl border border-white/10 flex flex-col md:flex-row items-center gap-4">
                        <span className="font-mono text-xl font-bold text-white tracking-widest">{data?.referralCode}</span>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={copyCode} className="gap-2 font-bold"><Copy size={16} /> Copiar</Button>
                            <Button size="sm" className="gap-2 font-bold bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                                const text = `Recomendo o BarberGo para sua barbearia! Sistema top. Chama o suporte deles e diz que fui eu quem indicou (Cód: ${data?.referralCode}): https://wa.me/558421335813?text=Ola,+gostaria+de+saber+mais.+Fui+indicado+pelo+codigo+${data?.referralCode}`
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                            }}>
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                Indicar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Regras */}
                <div className="bg-[#1A1B1F] border border-secondary p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                            <Coins size={24} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-white">Como funcionam as recompensas?</h3>
                            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                                <li>Você ganha <span className="text-white font-bold">50% de desconto</span> na próxima fatura por indicação.</li>
                                <li>A recompensa é liberada após o <span className="text-white font-bold">pagamento da 1ª mensalidade</span> do indicado.</li>
                                <li>Limite de resgate: <span className="text-white font-bold">1 recompensa por mês</span> (acumula para os próximos).</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-[#1A1B1F] border-secondary">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Total de Indicações</CardTitle>
                            <Users className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{data?.stats.total}</div>
                            <p className="text-xs text-gray-500">Unidades cadastradas com seu código</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#1A1B1F] border-secondary">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Recompensas Pendentes</CardTitle>
                            <Coins className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{data?.stats.pending}</div>
                            <p className="text-xs text-gray-500">Pronto para resgate</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#1A1B1F] border-secondary">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Total Resgatado</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{data?.stats.redeemed}</div>
                            <p className="text-xs text-gray-500">Descontos já aplicados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Lista */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Seus Indicados</h3>
                    {data?.referrals.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                            <Ticket size={48} className="mx-auto text-gray-600 mb-4" />
                            <p className="text-gray-400 font-medium">Você ainda não tem indicações.</p>
                            <p className="text-xs text-gray-600">Compartilhe seu código para começar a ganhar!</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {data?.referrals.map((ref: any) => (
                                <div key={ref.id} className="bg-[#1A1B1F] border border-secondary p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center font-bold text-gray-400">
                                            {ref.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{ref.name}</p>
                                            <p className="text-xs text-gray-500">Cadastrado em {format(new Date(ref.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className={`
                                            ${ref.subscription?.status === 'ACTIVE' ? 'border-green-500/50 text-green-500 bg-green-500/10' : ''}
                                            ${ref.subscription?.status === 'TRIAL' ? 'border-blue-500/50 text-blue-500 bg-blue-500/10' : ''}
                                            ${(!ref.subscription || (ref.subscription.status !== 'ACTIVE' && ref.subscription.status !== 'TRIAL')) ? 'border-gray-500 text-gray-500' : ''}
                                        `}>
                                            {ref.subscription?.status || 'INATIVO'}
                                        </Badge>
                                        {ref.referralRewardClaimed && <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center justify-end gap-1"><CheckCircle2 size={10} /> Recompensa Resgatada</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
