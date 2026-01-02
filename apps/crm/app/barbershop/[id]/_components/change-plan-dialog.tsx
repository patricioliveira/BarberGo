"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@barbergo/ui"
import { Settings, Check, Loader2 } from "lucide-react"
import { PLANS, PlanType, BillingCycle } from "@barbergo/shared"
import { switchPlan } from "../../../_actions/subscriptions"
import { toast } from "sonner"

export function ChangePlanDialog({ subscriptionId, currentPlan }: { subscriptionId: string, currentPlan: PlanType }) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentPlan)
    const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(BillingCycle.MONTHLY)
    const [billingType, setBillingType] = useState<"PREPAID" | "POSTPAID">("POSTPAID")
    const [paymentMethod, setPaymentMethod] = useState<string>("PIX")
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<"SELECT" | "CONFIRM">("SELECT")

    // Reset cycle/billing type when changes occur if needed, or keep persistent

    const details = PLANS[selectedPlan]
    const currentPrice = details.prices[selectedCycle]
    const isLongCycle = selectedCycle !== BillingCycle.MONTHLY

    // Determine if payment is required now
    // Payment required if: Long Cycle OR (Monthly AND Prepaid)
    const isPaymentRequired = isLongCycle || (selectedCycle === BillingCycle.MONTHLY && billingType === "PREPAID")

    const handleNext = () => {
        // Validation logic can go here
        setStep("CONFIRM")
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            await switchPlan(
                subscriptionId,
                selectedPlan,
                selectedCycle,
                selectedCycle === BillingCycle.MONTHLY ? billingType : "PREPAID", // Long cycles are always prepaid basically
                isPaymentRequired ? paymentMethod : undefined,
                isPaymentRequired ? currentPrice : undefined
            )
            toast.success("Plano atualizado com sucesso!")
            setIsOpen(false)
            setStep("SELECT")
        } catch (error) {
            toast.error("Erro ao atualizar plano.")
        } finally {
            setIsLoading(false)
        }
    }

    // Check if anything changed to enable buttons
    // Only strictly robust if we compare against original subscription state, 
    // but here we just check if selection is valid.
    // Ideally we should pass original cycle/billingType to component to compare against.
    // For now assuming any interaction allows "Next" if valid.

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-8 text-xs border-dashed gap-2">
                    <Settings size={14} /> Alterar Plano
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1B1F] border-white/10 text-white max-w-sm">
                <DialogHeader>
                    <DialogTitle>Alterar Assinatura</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {step === "SELECT" ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs uppercase font-bold text-gray-500">Novo Plano</label>
                                <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanType)}>
                                    <SelectTrigger className="bg-black/20 border-white/10 h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-secondary text-white border-white/10">
                                        {Object.values(PLANS).map((p) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase font-bold text-gray-500">Ciclo de Pagamento</label>
                                <Select value={selectedCycle} onValueChange={(v) => setSelectedCycle(v as BillingCycle)}>
                                    <SelectTrigger className="bg-black/20 border-white/10 h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-secondary text-white border-white/10">
                                        <SelectItem value={BillingCycle.MONTHLY}>Mensal</SelectItem>
                                        <SelectItem value={BillingCycle.SEMIANNUALLY}>Semestral (6 Meses)</SelectItem>
                                        <SelectItem value={BillingCycle.ANNUALLY}>Anual (12 Meses)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedCycle === BillingCycle.MONTHLY && (
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-gray-500">Tipo de Cobrança (Mensal)</label>
                                    <Select value={billingType} onValueChange={(v) => setBillingType(v as any)}>
                                        <SelectTrigger className="bg-black/20 border-white/10 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-secondary text-white border-white/10">
                                            <SelectItem value="POSTPAID">Pós-pago (Venc. em 30 dias)</SelectItem>
                                            <SelectItem value="PREPAID">Pré-pago (Pagar Agora)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Total:</span>
                                    <span className="font-bold text-white">R$ {currentPrice.toFixed(2)} {isPaymentRequired && <span className="text-xs text-yellow-400 ml-1">(Pagar Agora)</span>}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Profissionais:</span>
                                    <span className="font-bold text-white">{details.maxProfessionals}</span>
                                </div>
                                {details.id === PlanType.EXCLUSIVE && (
                                    <Badge className="bg-purple-500/20 text-purple-400 border-none w-full justify-center mt-2">
                                        ✨ Funcionalidades Exclusivas
                                    </Badge>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-2">
                                <p className="text-sm text-yellow-200 font-bold">Confirmação de Mudança</p>
                                <p className="text-xs text-gray-400">
                                    Você está alterando para o plano <strong className="text-white">{details.name}</strong> no ciclo <strong className="text-white">{selectedCycle === BillingCycle.MONTHLY ? 'Mensal' : selectedCycle === BillingCycle.SEMIANNUALLY ? 'Semestral' : 'Anual'}</strong>.
                                </p>
                            </div>

                            {isPaymentRequired && (
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-gray-500">Forma de Pagamento Inicial</label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger className="bg-black/20 border-white/10 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-secondary text-white border-white/10">
                                            <SelectItem value="PIX">Pix</SelectItem>
                                            <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                                            <SelectItem value="MONEY">Dinheiro / Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-gray-500">Ao confirmar, uma fatura paga será gerada e a assinatura ativada.</p>
                                </div>
                            )}

                            {!isPaymentRequired && (
                                <p className="text-xs text-gray-400">A fatura será gerada para pagamento em 30 dias.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {step === "CONFIRM" && (
                        <Button variant="ghost" onClick={() => setStep("SELECT")} className="flex-1">Voltar</Button>
                    )}
                    <Button onClick={step === "SELECT" ? handleNext : handleSave} disabled={isLoading} className="flex-1 font-bold">
                        {isLoading ? <Loader2 className="animate-spin" /> : step === "SELECT" ? "Continuar" : "Confirmar Mudança"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
