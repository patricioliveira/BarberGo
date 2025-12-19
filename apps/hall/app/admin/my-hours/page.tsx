"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // Correção: Importar de next/navigation
import Header from "../../_components/header"
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@barbergo/ui"
import { ChevronLeft, Clock, Save, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { getStaffHoursData, updateStaffHours } from "../../_actions/manage-staff-hours"
import { toast } from "sonner"
import { useSession } from "next-auth/react" // Hook correto para Client Components

type WorkingHour = { day: string; open: string; close: string; isOpen: boolean }

const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (c: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-700'}`}
    >
        <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
)

export default function MyHoursPage() { // REMOVIDO: async
    const router = useRouter()
    const { status } = useSession() // Hook para pegar a sessão no cliente

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [data, setData] = useState<{ staffHours: WorkingHour[], shopHours: WorkingHour[], staffId: string, shopName: string } | null>(null)

    // 1. Proteção de Rota e Carga de Dados
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        if (status === "authenticated") {
            const load = async () => {
                try {
                    setIsLoading(true)
                    const res = await getStaffHoursData()
                    setData(res)
                } catch (err) {
                    toast.error("Erro ao carregar seus dados.")
                    router.push("/admin")
                } finally {
                    setIsLoading(false)
                }
            }
            load()
        }
    }, [status, router])

    const handleToggleDay = (index: number) => {
        if (!data) return
        const newHours = [...data.staffHours]
        newHours[index] = { ...newHours[index], isOpen: !newHours[index].isOpen }
        setData({ ...data, staffHours: newHours })
    }

    const handleTimeChange = (index: number, field: 'open' | 'close', value: string) => {
        if (!data) return
        const newHours = [...data.staffHours]
        newHours[index] = { ...newHours[index], [field]: value }
        setData({ ...data, staffHours: newHours })
    }

    const handleSave = async () => {
        if (!data) return
        setIsSaving(true)

        // Validação: Não pode atender fora do horário da loja
        for (const staffH of data.staffHours) {
            const shopH = data.shopHours.find(h => h.day === staffH.day)
            if (staffH.isOpen && shopH) {
                if (!shopH.isOpen) {
                    toast.error(`A barbearia não abre na ${staffH.day}.`)
                    setIsSaving(false); return
                }
                if (staffH.open < shopH.open || staffH.close > shopH.close) {
                    toast.error(`Horário de ${staffH.day} excede o funcionamento da loja (${shopH.open} - ${shopH.close})`)
                    setIsSaving(false); return
                }
            }
        }

        try {
            const res = await updateStaffHours(data.staffId, data.staffHours)
            if (res.success) {
                toast.success("Agenda atualizada com sucesso!")
            }
        } catch (error) {
            toast.error("Erro ao salvar escala.")
        } finally {
            setIsSaving(false)
        }
    }

    // Loader enquanto carrega autenticação ou dados
    if (isLoading || status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-white pb-10">
            <Header />
            <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-3xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="hover:bg-secondary">
                            <Link href="/admin"><ChevronLeft /></Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Meus Horários</h1>
                            <p className="text-muted-foreground text-sm">Escala Individual em: {data?.shopName}</p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="font-bold">
                        {isSaving ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Save className="mr-2" size={16} />}
                        Salvar Escala
                    </Button>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3">
                    <AlertCircle className="text-blue-500 shrink-0" size={20} />
                    <p className="text-xs text-blue-200">
                        Os horários que você definir aqui serão usados para os clientes realizarem agendamentos diretamente com você.
                    </p>
                </div>

                <Card className="bg-[#1A1B1F] border-none text-white shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-primary flex items-center gap-2">
                            <Clock size={20} /> Escala Semanal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {data?.staffHours && data.staffHours.map((h, i) => {
                            const shopDay = data.shopHours.find(sh => sh.day === h.day)
                            return (
                                <div key={h.day} className="flex justify-between items-center p-3 border-b border-secondary/40 last:border-0 gap-3">
                                    <div className="flex items-center gap-4 min-w-[150px]">
                                        <Switch checked={h.isOpen} onCheckedChange={() => handleToggleDay(i)} />
                                        <span className={h.isOpen ? "text-white" : "text-gray-600"}>{h.day}</span>
                                    </div>

                                    {h.isOpen ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col items-center">
                                                <Input
                                                    type="time"
                                                    value={h.open}
                                                    onChange={e => handleTimeChange(i, 'open', e.target.value)}
                                                    className="w-24 bg-secondary border-none h-8 p-1 text-center"
                                                />
                                                <p className="text-[8px] text-gray-500 uppercase italic mt-1">Loja: {shopDay?.open}</p>
                                            </div>
                                            <span className="text-xs text-gray-500 mb-4">às</span>
                                            <div className="flex flex-col items-center">
                                                <Input
                                                    type="time"
                                                    value={h.close}
                                                    onChange={e => handleTimeChange(i, 'close', e.target.value)}
                                                    className="w-24 bg-secondary border-none h-8 p-1 text-center"
                                                />
                                                <p className="text-[8px] text-gray-500 uppercase italic mt-1">Loja: {shopDay?.close}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-600">Fechado</span>
                                    )}
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}