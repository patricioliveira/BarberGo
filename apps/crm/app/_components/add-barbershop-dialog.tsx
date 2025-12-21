"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@barbergo/ui"
import { UserPlus, Copy, CheckCircle2, Loader2 } from "lucide-react"
import { createBarbershopWithDetails } from "../_actions/barbershop"
import { toast } from "sonner"

export function AddBarbershopDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const fd = new FormData(e.currentTarget)

        try {
            const res = await createBarbershopWithDetails({
                name: fd.get("name") as string,
                slug: fd.get("slug") as string,
                address: fd.get("address") as string, // Corrigido: Agora enviando address
                ownerEmail: fd.get("email") as string,
                ownerName: fd.get("ownerName") as string,
                plan: fd.get("plan") as any,
                price: Number(fd.get("price")),
            })
            setResult({ ...res, email: fd.get("email") })
            toast.success("Unidade e Dono registrados!")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (result) return (
        <Dialog open={isOpen} onOpenChange={(v) => { if (!v) { setResult(null); setIsOpen(false) } }}>
            <DialogContent className="bg-secondary border-none text-white">
                <div className="flex flex-col items-center text-center space-y-4 py-6">
                    <CheckCircle2 size={48} className="text-green-500" />
                    <h2 className="text-xl font-bold">Unidade Criada!</h2>
                    <p className="text-sm text-gray-400">Envie os acessos para o cliente:</p>
                    <div className="p-4 bg-black/40 rounded-2xl w-full text-sm font-mono text-left space-y-1">
                        <p><strong>E-mail:</strong> {result.email}</p>
                        <p><strong>Senha:</strong> {result.tempPassword}</p>
                    </div>
                    <Button className="w-full gap-2 font-bold h-12" onClick={() => {
                        navigator.clipboard.writeText(`Olá! Aqui estão os seus acessos ao BarberGo:\n\nLink: barbergo.com.br\nLogin: ${result.email}\nSenha: ${result.tempPassword}\n\n(Ou entre direto com sua conta Google usando o mesmo e-mail)`);
                        toast.success("Copiado!");
                    }}><Copy size={16} /> Copiar Convite WhatsApp</Button>
                </div>
            </DialogContent>
        </Dialog>
    )

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 font-bold h-12 rounded-2xl gap-2 shadow-lg shadow-primary/20">
                    <UserPlus size={20} /> Nova Barbearia
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-secondary border-none text-white max-w-lg">
                <DialogHeader><DialogTitle className="text-xl font-black italic">NOVO PARCEIRO SAAS</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                    <div className="col-span-2 space-y-1"><Label>Nome da Barbearia</Label><Input name="name" required className="bg-black/20 border-white/10" /></div>
                    <div className="space-y-1"><Label>Slug URL</Label><Input name="slug" placeholder="ex: barba-nobre" required className="bg-black/20 border-white/10" /></div>
                    <div className="space-y-1"><Label>Plano</Label>
                        <Select name="plan" defaultValue="PRO">
                            <SelectTrigger className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-secondary text-white border-white/10"><SelectItem value="PRO">PRO</SelectItem><SelectItem value="PREMIUM">PREMIUM</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-2 space-y-1"><Label>Endereço Completo</Label><Input name="address" required className="bg-black/20 border-white/10" /></div>
                    <div className="space-y-1"><Label>Nome do Gestor</Label><Input name="ownerName" required className="bg-black/20 border-white/10" /></div>
                    <div className="space-y-1"><Label>E-mail do Gestor</Label><Input name="email" type="email" required className="bg-black/20 border-white/10" /></div>
                    <div className="col-span-2 space-y-1"><Label>Mensalidade (R$)</Label><Input name="price" type="number" step="0.01" defaultValue="89.90" className="bg-black/20 border-white/10 text-primary font-bold" /></div>
                    <Button type="submit" disabled={loading} className="col-span-2 mt-4 bg-primary font-bold h-12 uppercase">{loading ? <Loader2 className="animate-spin" /> : "Gerar Acesso e Unidade"}</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}