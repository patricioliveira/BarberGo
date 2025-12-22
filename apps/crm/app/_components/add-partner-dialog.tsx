"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Button, Input, Label } from "@barbergo/ui"
import { Users, Loader2 } from "lucide-react"
import { createPartner } from "../_actions/partners"
import { toast } from "sonner"

export function AddPartnerDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const fd = new FormData(e.currentTarget)

        try {
            await createPartner({
                name: fd.get("name") as string,
                email: fd.get("email") as string,
                percentage: Number(fd.get("percentage"))
            })
            toast.success("Parceiro cadastrado!")
            setIsOpen(false)
        } catch (err) {
            toast.error("Erro ao cadastrar parceiro")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-white/10 hover:bg-white/5 font-bold h-12 rounded-2xl gap-2">
                    <Users size={18} /> Novo Parceiro
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-secondary border-none text-white max-w-sm">
                <DialogHeader><DialogTitle className="uppercase italic font-black">Cadastrar Afiliado</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-1"><Label>Nome</Label><Input name="name" required className="bg-black/20 border-white/10" /></div>
                    <div className="space-y-1"><Label>E-mail</Label><Input name="email" type="email" required className="bg-black/20 border-white/10" /></div>
                    <div className="space-y-1"><Label>Comissão (%)</Label><Input name="percentage" type="number" defaultValue="10" className="bg-black/20 border-white/10" /></div>
                    <Button type="submit" disabled={loading} className="w-full h-12 bg-primary font-bold">
                        {loading ? <Loader2 className="animate-spin" /> : "Salvar Parceiro"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}