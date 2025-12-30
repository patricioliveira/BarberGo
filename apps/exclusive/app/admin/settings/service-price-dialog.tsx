
import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Input,
    Label,
    Switch
} from "@barbergo/ui"
import { User, Link as LinkIcon, DollarSign } from "lucide-react"

type StaffMember = { id: string; name: string; isActive: boolean; jobTitle: string }
type ServiceStaffPrice = { staffId: string; price: string; isLinked: boolean }

interface ServicePriceDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    serviceName: string
    basePrice: string
    staff: StaffMember[]
    initialPrices: ServiceStaffPrice[]
    onSave: (prices: ServiceStaffPrice[]) => void
}

export function ServicePriceDialog({
    isOpen,
    onOpenChange,
    serviceName,
    basePrice,
    staff,
    initialPrices,
    onSave
}: ServicePriceDialogProps) {
    const [prices, setPrices] = useState<ServiceStaffPrice[]>([])

    // Filtra apenas staff ativo para exibir na lista, ou que já tenha preço configurado
    const activeStaff = staff.filter(s => s.isActive || initialPrices.some(p => p.staffId === s.id))

    useEffect(() => {
        if (isOpen) {
            setPrices(initialPrices)
        }
    }, [isOpen, initialPrices])

    const getPrice = (staffId: string) => {
        return prices.find(p => p.staffId === staffId)?.price || basePrice
    }

    const isLinked = (staffId: string) => {
        return prices.find(p => p.staffId === staffId)?.isLinked || false
    }

    const updatePrice = (staffId: string, value: string) => {
        setPrices(prev => {
            const existing = prev.find(p => p.staffId === staffId)
            if (existing) {
                return prev.map(p => p.staffId === staffId ? { ...p, price: value } : p)
            }
            return [...prev, { staffId, price: value, isLinked: false }]
        })
    }

    const toggleLinked = (staffId: string) => {
        setPrices(prev => {
            const existing = prev.find(p => p.staffId === staffId)
            if (existing) {
                return prev.map(p => p.staffId === staffId ? { ...p, isLinked: !p.isLinked } : p)
            }
            // Se não existe, cria com o preço base e link ativado
            return [...prev, { staffId, price: basePrice, isLinked: true }]
        })
    }

    const handleSave = () => {
        // Remove entradas que são idênticas ao padrão (preço igual base e não linkado) para limpar banco? 
        // Ou salvamos tudo explicitamente? Melhor salvar apenas o que tem override ou link.
        // Mas para simplificar a edição futura, se o usuário editou, salvamos.
        // Se o preço for igual a base E não estiver linkado, podemos remover da lista.

        const cleanPrices = prices.filter(p => {
            const isBasePrice = Number(p.price) === Number(basePrice)
            const isNotLinked = !p.isLinked
            // Se for preço base e não linkado, não precisa salvar (remove do array)
            // MAS: se já existia no banco, precisamos mandar para o backend saber atualizar/manter?
            // O backend faz "deleteMany" e insert novos. Então se removermos aqui, será deletado no backend.
            // Isso é o comportamento desejado: voltar ao padrão.
            return !(isBasePrice && isNotLinked)
        })

        onSave(cleanPrices)
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1A1B1F] border-secondary text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gerenciar Preços e Vínculos: {serviceName}</DialogTitle>
                    <p className="text-xs text-gray-400">Defina preços diferenciados por profissional e vincule o barbeiro ao serviço para seleção automática.</p>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-12 gap-4 items-center px-2 py-2 bg-black/20 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <div className="col-span-5">Profissional</div>
                        <div className="col-span-4 text-center">Preço (Base: R$ {basePrice})</div>
                        <div className="col-span-3 text-center">Auto-Selecionar</div>
                    </div>

                    {activeStaff.map(member => {
                        const currentPrice = getPrice(member.id)
                        const linked = isLinked(member.id)
                        const isCustom = Number(currentPrice) !== Number(basePrice)

                        return (
                            <div key={member.id} className={`grid grid-cols-12 gap-4 items-center p-3 rounded-xl border transition-all ${linked ? 'bg-primary/5 border-primary/30' : 'bg-transparent border-secondary/30'}`}>
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
                                        <User size={14} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{member.name}</p>
                                        <p className="text-[10px] text-gray-500">{member.jobTitle}</p>
                                    </div>
                                </div>
                                <div className="col-span-4 flex items-center justify-center">
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">R$</span>
                                        <Input
                                            type="number"
                                            value={currentPrice}
                                            onChange={(e) => updatePrice(member.id, e.target.value)}
                                            className={`pl-8 h-9 text-sm font-bold border-none text-center ${isCustom ? 'text-primary bg-primary/10' : 'text-gray-400 bg-black/20'}`}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-3 flex justify-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <Switch checked={linked} onCheckedChange={() => toggleLinked(member.id)} />
                                        {linked && <span className="text-[9px] text-primary font-bold flex gap-1"><LinkIcon size={10} /> Vinculado</span>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <DialogFooter className="border-t border-white/5 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-secondary text-gray-400">Cancelar</Button>
                    <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white">Salvar Diferenças</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
