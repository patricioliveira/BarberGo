"use client"

import { useState, useEffect } from "react"
import Header from "../../_components/header"
import { Card, CardContent, Button, Badge } from "@barbergo/ui" // Adicionado Loader2
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, CheckCircle2, Clock, XCircle, User, Loader2, CalendarCheck2 } from "lucide-react"
import Link from "next/link"
import { getAdminDashboard } from "../../_actions/get-admin-dashboard"
import { useSession } from "next-auth/react" // Hook correto
import { useRouter } from "next/navigation" // Router correto
import Footer from "@/_components/footer"

export default function MySchedulePage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [bookings, setBookings] = useState<any[]>([])
    const [filter, setFilter] = useState<"CONFIRMED" | "FINISHED" | "CANCELED">("CONFIRMED")
    const [isLoading, setIsLoading] = useState(true)

    // 1. Proteção de rota e Carga de dados
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        if (status === "authenticated") {
            const load = async () => {
                try {
                    setIsLoading(true)
                    const data = await getAdminDashboard()
                    // Filtra apenas os agendamentos do barbeiro logado (STAFF)
                    setBookings(data.personalBookings || [])
                } catch (error) {
                    console.error("Erro ao carregar agenda:", error)
                } finally {
                    setIsLoading(false)
                }
            }
            load()
        }
    }, [status, router])

    const filteredBookings = bookings.filter(b => b.status === filter)

    // Tela de carregamento enquanto valida sessão ou busca dados
    if (isLoading || status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-white">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-white">
            <Header />
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-secondary">
                        <Link href="/admin"><ChevronLeft /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Minha Agenda</h1>
                        <p className="text-muted-foreground text-sm">Gerencie seus atendimentos diários</p>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button
                        variant={filter === "CONFIRMED" ? "default" : "secondary"}
                        onClick={() => setFilter("CONFIRMED")}
                        className={`rounded-full gap-2 transition-all ${filter === "CONFIRMED" ? "bg-primary text-white" : "bg-[#1A1B1F] text-gray-400"}`}
                    >
                        <Clock size={16} /> Agendados
                    </Button>
                    <Button
                        variant={filter === "FINISHED" ? "default" : "secondary"}
                        onClick={() => setFilter("FINISHED")}
                        className={`rounded-full gap-2 transition-all ${filter === "FINISHED" ? "bg-primary text-white" : "bg-[#1A1B1F] text-gray-400"}`}
                    >
                        <CheckCircle2 size={16} /> Finalizados
                    </Button>
                    <Button
                        variant={filter === "CANCELED" ? "default" : "secondary"}
                        onClick={() => setFilter("CANCELED")}
                        className={`rounded-full gap-2 transition-all ${filter === "CANCELED" ? "bg-primary text-white" : "bg-[#1A1B1F] text-gray-400"}`}
                    >
                        <XCircle size={16} /> Cancelados
                    </Button>
                </div>

                {/* LISTAGEM */}
                <div className="grid gap-4">
                    {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
                        <Card key={booking.id} className="bg-[#1A1B1F] border-secondary overflow-hidden shadow-lg">
                            <CardContent className="p-0 flex items-stretch">
                                <div className="bg-primary w-1.5 flex-shrink-0" />
                                <div className="p-4 flex flex-1 items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center min-w-[60px]">
                                            <p className="text-xl font-bold text-white">{format(new Date(booking.date), "HH:mm")}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-semibold">
                                                {format(new Date(booking.date), "dd MMM", { locale: ptBR })}
                                            </p>
                                        </div>
                                        <div className="h-10 w-[1px] bg-secondary" />
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <User size={14} className="text-primary" />
                                                <p className="font-bold text-white">{booking.user.name}</p>
                                            </div>
                                            <p className="text-sm text-gray-400">{booking.service.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                                        {filter === "CONFIRMED" && (
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" className="text-green-500 border-green-500/30 hover:bg-green-500/10 h-8 text-xs font-bold">
                                                    Finalizar
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-500/10 h-8 text-xs">
                                                    Cancelar
                                                </Button>
                                            </div>
                                        )}
                                        <Badge variant="secondary" className="bg-[#26272B] text-gray-300 font-medium">
                                            {booking.status === "CONFIRMED" ? "Agendado" :
                                                booking.status === "FINISHED" ? "Finalizado" : "Cancelado"}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border-2 border-dashed border-secondary rounded-2xl bg-[#1A1B1F]/50">
                            <CalendarCheck2 size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Nenhum agendamento encontrado.</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    )
}