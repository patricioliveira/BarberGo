"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@barbergo/ui"
import { Settings, Check, Loader2 } from "lucide-react"
import { PLANS, PlanType } from "@barbergo/shared"
import { switchPlan } from "../../../_actions/subscriptions"
import { toast } from "sonner"

export function ChangePlanDialog({ subscriptionId, currentPlan }: { subscriptionId: string, currentPlan: PlanType }) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentPlan)
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        setIsLoading(true)
        try {
            await switchPlan(subscriptionId, selectedPlan)
            toast.success("Plano atualizado com sucesso!")
            setIsOpen(false)
        } catch (error) {
            toast.error("Erro ao atualizar plano.")
        } finally {
            setIsLoading(false)
        }
    }

    const details = PLANS[selectedPlan]

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
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-gray-500">Novo Plano</label>
                        <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanType)}>
                            <SelectTrigger className="bg-black/20 border-white/10 h-11"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-secondary text-white border-white/10">
                                {Object.values(PLANS).map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Mensalidade:</span>
                            <span className="font-bold text-white">R$ {details.price.toFixed(2)}</span>
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
                </div>

                <Button onClick={handleSave} disabled={isLoading || selectedPlan === currentPlan} className="w-full font-bold">
                    {isLoading ? <Loader2 className="animate-spin" /> : "Confirmar Mudança"}
                </Button>
            </DialogContent>
        </Dialog>
    )
}
