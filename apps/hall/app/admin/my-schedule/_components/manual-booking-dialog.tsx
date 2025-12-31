"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@barbergo/ui"
import { CalendarIcon, Loader2, User, Search } from "lucide-react"
import { createManualBooking } from "@/_actions/create-manual-booking"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ManualBookingDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    services: any[]
    staff: any[]
    preSelectedDate?: Date
    currentStaffId?: string // If current user is staff, preselect/lock
    isAdmin: boolean
}

export function ManualBookingDialog({ isOpen, onOpenChange, services, staff, preSelectedDate, currentStaffId, isAdmin }: ManualBookingDialogProps) {
    const [loading, setLoading] = useState(false)

    const [selectedServiceId, setSelectedServiceId] = useState("")
    const [selectedStaffId, setSelectedStaffId] = useState(currentStaffId || "")
    const [date, setDate] = useState(preSelectedDate ? format(preSelectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"))
    const [time, setTime] = useState(preSelectedDate ? format(preSelectedDate, "HH:mm") : "09:00")

    // Client Info
    const [clientType, setClientType] = useState<"MANUAL" | "REGISTERED">("MANUAL")
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [observation, setObservation] = useState("")

    useEffect(() => {
        if (!isOpen) {
            // Reset fields
            setCustomerName("")
            setCustomerPhone("")
            setObservation("")
        }
    }, [isOpen])

    const handleSave = async () => {
        if (!selectedServiceId) return toast.error("Selecione um serviço.")
        if (!selectedStaffId) return toast.error("Selecione um profissional.")
        if (!date || !time) return toast.error("Selecione data e hora.")
        if (clientType === "MANUAL" && !customerName) return toast.error("Informe o nome do cliente.")

        setLoading(true)
        try {
            const dateTime = new Date(`${date}T${time}`)

            const res = await createManualBooking({
                serviceId: selectedServiceId,
                staffId: selectedStaffId,
                date: dateTime,
                customerName,
                customerPhone,
                observation
            })

            if (res.success) {
                toast.success("Agendamento criado!")
                onOpenChange(false)
            } else {
                toast.error(res.error)
            }
        } catch (err) {
            toast.error("Erro ao criar agendamento.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1A1B1F] border-secondary text-white max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Agendamento Manual</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Serviço e Profissional */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Serviço</Label>
                            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                <SelectTrigger className="bg-secondary border-none">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {services.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Profissional</Label>
                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId} disabled={!isAdmin && !!currentStaffId}>
                                <SelectTrigger className="bg-secondary border-none">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {staff.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name || s.user?.name || "Sem Nome"}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Data e Hora */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-secondary border-none" />
                        </div>
                        <div className="space-y-2">
                            <Label>Hora</Label>
                            <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-secondary border-none" />
                        </div>
                    </div>

                    <div className="border-t border-white/10 my-2"></div>

                    {/* Cliente */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="font-bold">Dados do Cliente</Label>
                            {/* Future: Toggle for Registered Users Search */}
                        </div>

                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome do cliente" className="bg-secondary border-none" />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefone / WhatsApp</Label>
                            <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(00) 00000-0000" className="bg-secondary border-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Observação</Label>
                        <Input value={observation} onChange={e => setObservation(e.target.value)} placeholder="Opcional" className="bg-secondary border-none" />
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 animate-spin" size={16} />} Agendar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
