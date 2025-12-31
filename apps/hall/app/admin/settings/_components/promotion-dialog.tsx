"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label, Switch, CurrencyInput, Calendar } from "@barbergo/ui"
import { Loader2, Percent, DollarSign, Calendar as CalendarIcon } from "lucide-react"
import { savePromotion } from "@/_actions/save-promotion"
import { toast } from "sonner"
import { format, eachDayOfInterval, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PromotionDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    service: any
    promotion?: any
}

export function PromotionDialog({ isOpen, onOpenChange, service, promotion }: PromotionDialogProps) {
    const [loading, setLoading] = useState(false)
    const [isActive, setIsActive] = useState(true)
    const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE")
    const [value, setValue] = useState("")

    // Dates are now Date objects or null/undefined
    const [startDate, setStartDate] = useState<Date | undefined>(new Date())
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)

    // Controls for Date Pickers
    const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false)
    const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false)

    const [specificDays, setSpecificDays] = useState<number[]>([])
    // Available days calculation
    const [availableDays, setAvailableDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])

    const daysOfWeek = [
        { label: "Dom", value: 0 },
        { label: "Seg", value: 1 },
        { label: "Ter", value: 2 },
        { label: "Qua", value: 3 },
        { label: "Qui", value: 4 },
        { label: "Sex", value: 5 },
        { label: "Sáb", value: 6 },
    ]

    useEffect(() => {
        if (promotion) {
            setIsActive(promotion.isActive)
            if (promotion.discountPercentage) {
                setType("PERCENTAGE")
                setValue(promotion.discountPercentage.toString())
            } else if (promotion.promotionalPrice) {
                setType("FIXED")
                setValue(promotion.promotionalPrice.toString())
            }
            if (promotion.startDate) setStartDate(new Date(promotion.startDate))
            if (promotion.endDate) setEndDate(new Date(promotion.endDate))
            if (promotion.specificDays) setSpecificDays(promotion.specificDays)
        } else {
            // Reset fields
            setIsActive(true)
            setValue("")
            setStartDate(new Date())
            setEndDate(undefined)
            setSpecificDays([])
        }
    }, [promotion, isOpen])

    // Calculate Available Days based on Range
    useEffect(() => {
        if (startDate && endDate) {
            // If checking "Single Day", start == end
            if (isSameDay(startDate, endDate)) {
                // Only that day is available
                setAvailableDays([startDate.getDay()])
                setSpecificDays([]) // Clear specific days as it's redundant/forced
                return
            }

            // Iterate interval
            if (startDate < endDate) {
                try {
                    const interval = eachDayOfInterval({ start: startDate, end: endDate })
                    const daysPresent = new Set(interval.map(d => d.getDay()))
                    setAvailableDays(Array.from(daysPresent))

                    // Cleanup selected specificDays that are no longer valid
                    setSpecificDays(prev => prev.filter(d => daysPresent.has(d)))
                } catch (e) {
                    // Fallback
                    setAvailableDays([0, 1, 2, 3, 4, 5, 6])
                }
            } else {
                // Invalid range (End < Start), handle gracefully
                setAvailableDays([0, 1, 2, 3, 4, 5, 6])
            }
        } else {
            // If no end date, all days are theoretically possible
            setAvailableDays([0, 1, 2, 3, 4, 5, 6])
        }
    }, [startDate, endDate])

    const toggleDay = (day: number) => {
        if (!availableDays.includes(day)) return

        if (specificDays.includes(day)) {
            setSpecificDays(specificDays.filter(d => d !== day))
        } else {
            setSpecificDays([...specificDays, day])
        }
    }

    const handleSave = async () => {
        if (!value) return toast.error("Informe o valor do desconto.")
        if (!startDate) return toast.error("Informe a data de início.")

        setLoading(true)
        try {
            const res = await savePromotion({
                serviceId: service.id,
                isActive,
                startDate: startDate,
                endDate: endDate,
                specificDays,
                discountPercentage: type === "PERCENTAGE" ? Number(value) : undefined,
                promotionalPrice: type === "FIXED" ? Number(value) : undefined
            })

            if (res.success) {
                toast.success("Promoção salva!")
                onOpenChange(false)
                window.location.reload()
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error("Erro ao salvar.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1A1B1F] border-secondary text-white max-w-md">
                <DialogHeader>
                    <DialogTitle>Promoção: {service?.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                        <Label>Promoção Ativa</Label>
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de Desconto</Label>
                        <div className="flex gap-2">
                            <Button
                                variant={type === "PERCENTAGE" ? "default" : "outline"}
                                onClick={() => setType("PERCENTAGE")}
                                className="flex-1"
                            >
                                <Percent size={14} className="mr-2" /> Porcentagem
                            </Button>
                            <Button
                                variant={type === "FIXED" ? "default" : "outline"}
                                onClick={() => setType("FIXED")}
                                className="flex-1"
                            >
                                <DollarSign size={14} className="mr-2" /> Valor Fixo
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{type === "PERCENTAGE" ? "Porcentagem de Desconto (%)" : "Novo Preço (R$)"}</Label>
                        {type === "PERCENTAGE" ? (
                            <Input
                                type="number"
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                className="bg-secondary border-none font-bold text-lg"
                                placeholder="Ex: 20"
                            />
                        ) : (
                            <CurrencyInput
                                value={Number(value)}
                                onChange={(val: number) => setValue(val.toString())}
                                className="bg-secondary border-none font-bold text-lg"
                                placeholder="Ex: R$ 25,00"
                            />
                        )}
                        {type === "PERCENTAGE" && service?.price && value && (
                            <p className="text-xs text-gray-400">
                                Preço Final: <span className="text-green-500 font-bold">
                                    {(Number(service.price) * (1 - Number(value) / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Início</Label>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal bg-secondary border-none h-10"
                                onClick={() => setIsStartCalendarOpen(true)}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>Fim (Opcional)</Label>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal bg-secondary border-none h-10"
                                onClick={() => setIsEndCalendarOpen(true)}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Dias Específicos (Opcional)</Label>
                        <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map(day => {
                                const isDisabled = !availableDays.includes(day.value)
                                const isSelected = specificDays.includes(day.value)
                                return (
                                    <button
                                        key={day.value}
                                        onClick={() => toggleDay(day.value)}
                                        disabled={isDisabled}
                                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${isDisabled ? "opacity-20 cursor-not-allowed bg-secondary text-gray-600" :
                                            isSelected ? "bg-primary text-white" : "bg-secondary text-gray-400 hover:bg-secondary/80"
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                )
                            })}
                        </div>
                        <p className="text-[10px] text-gray-500">
                            {availableDays.length < 7
                                ? "Dias fora do período selecionado foram desabilitados."
                                : "Se nenhum for selecionado, vale para todos os dias."
                            }
                        </p>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 animate-spin" size={16} />} Salvar Promoção
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Start Date Dialog */}
            <Dialog open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                <DialogContent className="w-auto p-0 pt-8 bg-[#1A1B1F] border-secondary text-white">
                    <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => { if (date) { setStartDate(date); setIsStartCalendarOpen(false) } }}
                        locale={ptBR}
                        initialFocus
                        className="rounded-md border-none"
                    />
                </DialogContent>
            </Dialog>

            {/* End Date Dialog */}
            <Dialog open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                <DialogContent className="w-auto p-0 pt-8 bg-[#1A1B1F] border-secondary text-white">
                    <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                            // Permite limpar? O componente Calendar 'single' geralmente obriga seleção se required não for false.
                            // Vamos assumir que selecionou data. Se ele quiser limpar, precisaria de um botão "Limpar".
                            // Por simplicidade: seleciona a data. Para remover data fim, o usuário talvez precise de um botão "X".
                            if (date) { setEndDate(date); setIsEndCalendarOpen(false) }
                        }}
                        locale={ptBR}
                        initialFocus
                        className="rounded-md border-none"
                        fromDate={startDate} // Não pode acabar antes de começar
                    />
                    <div className="p-2 border-t border-secondary flex justify-center">
                        <Button variant="ghost" size="sm" className="text-red-500 text-xs" onClick={() => { setEndDate(undefined); setIsEndCalendarOpen(false) }}>
                            Remover Data Fim
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    )
}
