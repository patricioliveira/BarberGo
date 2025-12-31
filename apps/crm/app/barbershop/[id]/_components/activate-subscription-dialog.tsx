"use client"

import { useState, useTransition } from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
    Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, CurrencyInput
} from "@barbergo/ui"
import { CheckCircle, Loader2 } from "lucide-react"
import { confirmPaymentAndActivate } from "@/app/_actions/subscriptions"
import { toast } from "sonner"

interface ActivateSubscriptionDialogProps {
    subscriptionId: string
    defaultPrice: number
    pendingRewards?: number
}

export function ActivateSubscriptionDialog({ subscriptionId, defaultPrice, pendingRewards = 0 }: ActivateSubscriptionDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Estados do formulário
    const [amount, setAmount] = useState(defaultPrice.toString())
    const [method, setMethod] = useState("PIX")
    const [redeemReward, setRedeemReward] = useState(false)

    // Efeito para ajustar preço se resgatar
    const toggleReward = (val: boolean) => {
        setRedeemReward(val)
        if (val) {
            setAmount((defaultPrice / 2).toString())
            toast.info("Desconto de 50% aplicado!")
        } else {
            setAmount(defaultPrice.toString())
        }
    }

    const handleActivate = async () => {
        startTransition(async () => {
            try {
                await confirmPaymentAndActivate(subscriptionId, Number(amount), method, redeemReward)
                toast.success("Pagamento confirmado e assinatura ativada!")
                setIsOpen(false)
            } catch (error: any) {
                toast.error(error.message || "Erro ao processar ativação.")
            }
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700 font-bold">
                    <CheckCircle size={18} /> Confirmar Pagamento / Ativar
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1B1F] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase italic">Confirmar Faturamento</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Recompensa */}
                    {pendingRewards > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-500 p-2 rounded-full text-black"><CheckCircle size={16} /></div>
                                <div>
                                    <p className="font-bold text-amber-500 text-sm">Recompensa Disponível</p>
                                    <p className="text-[10px] text-gray-400">Você tem {pendingRewards} indicações aprovadas.</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant={redeemReward ? "default" : "outline"}
                                className={redeemReward ? "bg-amber-500 text-black hover:bg-amber-600 font-bold" : "border-amber-500/50 text-amber-500"}
                                onClick={() => toggleReward(!redeemReward)}
                            >
                                {redeemReward ? "Resgatando (50% OFF)" : "Usar Recompensa"}
                            </Button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="amount">Valor Recebido (R$)</Label>
                        <CurrencyInput
                            id="amount"
                            value={Number(amount)}
                            onChange={(val) => setAmount(val.toString())}
                            className="bg-black/20 border-white/10 focus:border-green-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Método de Pagamento</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="bg-black/20 border-white/10">
                                <SelectValue placeholder="Selecione o método" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1A1B1F] border-white/10 text-white">
                                <SelectItem value="PIX">PIX</SelectItem>
                                <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                                <SelectItem value="CASH">Dinheiro / Espécie</SelectItem>
                                <SelectItem value="TRANSFER">Transferência Bancária</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Button
                        onClick={handleActivate}
                        disabled={isPending}
                        className="bg-green-600 hover:bg-green-700 font-bold h-12"
                    >
                        {isPending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" size={18} />}
                        Confirmar e Gerar Fatura
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}