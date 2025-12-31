"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Header from "@/_components/header"
import { Button, Input, Sheet, SheetContent, SheetHeader, SheetTitle, Avatar, AvatarImage, AvatarFallback, Card, CardContent } from "@barbergo/ui"
import { ArrowLeft, Search, Loader2, User, Ban, CheckCircle2, XCircle, Clock, DollarSign, Calendar, Users } from "lucide-react"
import { getBarbershopClients, toggleClientBlock } from "@/_actions/barbershop-clients"
import { toast } from "sonner"

export default function AdminClientsPage() {
    const router = useRouter()
    const { status } = useSession()
    const [isLoading, setIsLoading] = useState(true)
    const [clients, setClients] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    useEffect(() => {
        if (status === "unauthenticated") router.push("/")
        if (status === "authenticated") {
            if ((status as any) === "authenticated" && (useSession as any)?.data?.user?.role === "STAFF") {
                router.push("/admin")
            } else {
                fetchData()
            }
        }
    }, [status, router])

    const fetchData = async () => {
        try {
            const data = await getBarbershopClients()
            setClients(data)
        } catch (error) {
            toast.error("Erro ao carregar clientes.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleBlockToggle = async () => {
        if (!selectedClient) return
        try {
            const res = await toggleClientBlock(selectedClient.user.id)
            const updated = clients.map(c => c.user.id === selectedClient.user.id ? { ...c, isBlocked: res.blocked } : c)
            setClients(updated)
            setSelectedClient({ ...selectedClient, isBlocked: res.blocked })
            toast.success(res.blocked ? "Cliente bloqueado." : "Cliente desbloqueado.")
        } catch { toast.error("Erro na ação.") }
    }

    const filtered = clients.filter(c =>
        c.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={40} /></div>

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <div className="container mx-auto p-5 md:p-8 max-w-5xl pb-24">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="icon" onClick={() => router.push("/admin")} className="shrink-0 border-secondary"><ArrowLeft size={20} /></Button>
                    <h1 className="text-2xl font-bold text-white">Carteira de Clientes</h1>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <Input placeholder="Buscar cliente..." className="bg-[#1A1B1F] border-secondary pl-10 h-12" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>

                <div className="grid gap-3">
                    {filtered.length === 0 && !isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-xl border border-dashed border-white/5 bg-[#1A1B1F]/50">
                            <div className="p-4 bg-black/40 rounded-full border border-white/5">
                                <Users size={32} className="text-gray-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white">Nenhum cliente encontrado</p>
                                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                                    {searchTerm ? "Tente buscar por outro nome ou e-mail." : "Sua carteira de clientes ainda está vazia. Agendamentos concluídos aparecerão aqui."}
                                </p>
                            </div>
                            {searchTerm && (
                                <Button variant="outline" size="sm" onClick={() => setSearchTerm("")} className="border-secondary text-xs h-8">
                                    Limpar busca
                                </Button>
                            )}
                        </div>
                    ) : (
                        filtered.map((client) => (
                            <div key={client.user.id} className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:bg-white/5 ${client.isBlocked ? 'bg-red-950/20 border-red-900/50' : 'bg-[#1A1B1F] border-secondary'}`} onClick={() => { setSelectedClient(client); setIsSheetOpen(true); }}>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border border-secondary/50">
                                        <AvatarImage src={client.user.image} />
                                        <AvatarFallback><User /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white">{client.user.name}</p>
                                            {client.isBlocked && <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded text-white font-bold">BLOQUEADO</span>}
                                        </div>
                                        <p className="text-xs text-gray-400">{client.user.email}</p>
                                        <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
                                            <span>Total: {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.stats.totalSpent)}</span>
                                            <span>•</span>
                                            <span>{client.stats.completedCount} visitas</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="bg-[#1A1B1F] border-secondary text-white w-full sm:max-w-md overflow-y-auto pt-[calc(env(safe-area-inset-top)+2rem)]">
                    {selectedClient && (
                        <>
                            <SheetHeader className="mb-6 text-left">
                                <SheetTitle className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={selectedClient.user.image} />
                                        <AvatarFallback><User /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p>{selectedClient.user.name}</p>
                                        <p className="text-xs font-normal text-gray-400">{selectedClient.user.email}</p>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <Card className="bg-black/20 border-white/5"><CardContent className="p-4"><p className="text-xs text-gray-500">Gasto Total</p><p className="text-xl font-bold text-primary">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedClient.stats.totalSpent)}</p></CardContent></Card>
                                    <Card className="bg-black/20 border-white/5"><CardContent className="p-4"><p className="text-xs text-gray-500">Este Mês</p><p className="text-xl font-bold text-white">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedClient.stats.monthSpent)}</p></CardContent></Card>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Histórico</p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/20"><p className="text-lg font-bold text-green-500">{selectedClient.stats.completedCount}</p><p className="text-[10px] text-green-200">Concluídos</p></div>
                                        <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20"><p className="text-lg font-bold text-red-500">{selectedClient.stats.canceledCount}</p><p className="text-[10px] text-red-200">Cancelados</p></div>
                                        <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20"><p className="text-lg font-bold text-amber-500">{selectedClient.stats.pendingCount}</p><p className="text-[10px] text-amber-200">Futuros</p></div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Serviços Favoritos</p>
                                    {Object.entries(selectedClient.stats.serviceStats).map(([name, total]: any) => (
                                        <div key={name} className="flex justify-between text-sm border-b border-white/5 pb-2">
                                            <span>{name}</span>
                                            <span className="text-gray-400">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    variant={selectedClient.isBlocked ? "outline" : "destructive"}
                                    className="w-full mt-6"
                                    onClick={handleBlockToggle}
                                >
                                    {selectedClient.isBlocked ? <><CheckCircle2 className="mr-2" size={16} /> Desbloquear Cliente</> : <><Ban className="mr-2" size={16} /> Bloquear Cliente</>}
                                </Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}