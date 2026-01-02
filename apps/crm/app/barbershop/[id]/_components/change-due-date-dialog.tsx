"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Button, Calendar } from "@barbergo/ui"
import { CalendarIcon, Loader2 } from "lucide-react"
import { updateSubscriptionDueDate } from "../../../_actions/subscriptions"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function ChangeDueDateDialog({ subscriptionId, currentDueDate }: { subscriptionId: string, currentDueDate: Date }) {
    const [isOpen, setIsOpen] = useState(false)
    const [date, setDate] = useState<Date | undefined>(currentDueDate ? new Date(currentDueDate) : undefined)
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        if (!date) return

        setIsLoading(true)
        try {
            await updateSubscriptionDueDate(subscriptionId, date)
            toast.success("Vencimento atualizado com sucesso!")
            setIsOpen(false)
        } catch (error) {
            toast.error("Erro ao atualizar vencimento.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-white">
                    <CalendarIcon size={14} />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1B1F] border-white/10 text-white max-w-sm">
                <DialogHeader>
                    <DialogTitle>Alterar Vencimento</DialogTitle>
                </DialogHeader>

                <div className="py-4 flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="rounded-md border border-white/10 bg-black/20 text-white"
                        classNames={{
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-white/10 text-white",
                        }}
                    />
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-center text-gray-400">
                        Novo vencimento: <strong className="text-white">{date ? format(date, "dd 'de' MMMM, yyyy", { locale: ptBR }) : '-'}</strong>
                    </p>

                    <Button onClick={handleSave} disabled={isLoading || !date} className="w-full font-bold">
                        {isLoading ? <Loader2 className="animate-spin" /> : "Salvar Nova Data"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
