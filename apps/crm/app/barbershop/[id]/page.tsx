"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Label } from "@barbergo/ui"
import { ChevronLeft, ShieldAlert, CheckCircle, Ban, CreditCard, User } from "lucide-react"
import { toast } from "sonner"

export default function ManageBarbershopPage() {
    const { id } = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleStatusChange = async (newStatus: string) => {
        setLoading(true)
        try {
            // Aqui você precisaria de uma action getBarbershopById para pegar o ID da subscription
            // Mas para o exemplo, vamos focar na UI de decisão
            toast.success(`Status alterado para ${newStatus}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                <ChevronLeft size={16} /> Voltar ao Dashboard
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Configurações da Unidade</h1>
                    <p className="text-gray-500">ID do Parceiro: {id}</p>
                </div>
                <Badge className="bg-green-500/10 text-green-500 border-none">ASSINATURA ATIVA</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ações Financeiras */}
                <Card className="bg-secondary border-none">
                    <CardHeader><CardTitle className="text-sm uppercase font-black text-gray-400">Controle de Acesso</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange("ACTIVE")}>
                            <CheckCircle size={18} /> Confirmar Pagamento / Ativar
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2 border-amber-500 text-amber-500" onClick={() => handleStatusChange("PAST_DUE")}>
                            <ShieldAlert size={18} /> Marcar Inadimplência (Aviso)
                        </Button>
                        <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => handleStatusChange("SUSPENDED")}>
                            <Ban size={18} /> Bloquear Acesso Imediatamente
                        </Button>
                    </CardContent>
                </Card>

                {/* Resumo do Plano */}
                <Card className="bg-secondary border-none">
                    <CardHeader><CardTitle className="text-sm uppercase font-black text-gray-400">Dados do Plano</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Valor da Mensalidade (R$)</Label>
                            <Input defaultValue="89.90" className="bg-black/20 border-white/10" />
                        </div>
                        <Button className="w-full bg-primary font-bold">Atualizar Valor</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}