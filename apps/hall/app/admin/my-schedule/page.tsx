"use client"

import { useState, useEffect } from "react"
import Header from "../../_components/header"
import { Card, CardContent, Button, Badge } from "@barbergo/ui"
import { format, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, CheckCircle2, Clock, XCircle, User } from "lucide-react"
import Link from "next/link"
import { getAdminDashboard } from "../../_actions/get-admin-dashboard"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { redirect } from "next/navigation"

export default async function MySchedulePage() {
    const [bookings, setBookings] = useState<any[]>([])
    const [filter, setFilter] = useState<"CONFIRMED" | "FINISHED" | "CANCELED">("CONFIRMED")

    const session = await getServerSession(authOptions)
        
    if (!session?.user) {
        redirect("/")
    }

    useEffect(() => {
        const load = async () => {
            const data = await getAdminDashboard()
            setBookings(data.personalBookings || [])
        }
        load()
    }, [])

    const filteredBookings = bookings.filter(b => b.status === filter)

    return (
        <div className="min-h-screen bg-background text-white">
            <Header />
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin"><ChevronLeft /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Minha Agenda</h1>
                        <p className="text-muted-foreground text-sm">Gerencie seus atendimentos diários</p>
                    </div>
                </div>

                {/* FILTROS BONITOS */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <Button
                        variant={filter === "CONFIRMED" ? "default" : "secondary"}
                        onClick={() => setFilter("CONFIRMED")}
                        className="rounded-full gap-2"
                    >
                        <Clock size={16} /> Agendados
                    </Button>
                    <Button
                        variant={filter === "FINISHED" ? "default" : "secondary"}
                        onClick={() => setFilter("FINISHED")}
                        className="rounded-full gap-2"
                    >
                        <CheckCircle2 size={16} /> Finalizados
                    </Button>
                    <Button
                        variant={filter === "CANCELED" ? "default" : "secondary"}
                        onClick={() => setFilter("CANCELED")}
                        className="rounded-full gap-2"
                    >
                        <XCircle size={16} /> Cancelados
                    </Button>
                </div>

                <div className="grid gap-4">
                    {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
                        <Card key={booking.id} className="bg-[#1A1B1F] border-secondary overflow-hidden">
                            <CardContent className="p-0 flex items-stretch">
                                <div className="bg-primary w-2 flex-shrink-0" />
                                <div className="p-4 flex flex-1 items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-xl font-bold">{format(new Date(booking.date), "HH:mm")}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">{format(new Date(booking.date), "dd MMM")}</p>
                                        </div>
                                        <div className="h-10 w-[1px] bg-secondary" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-primary" />
                                                <p className="font-bold">{booking.user.name}</p>
                                            </div>
                                            <p className="text-sm text-gray-400">{booking.service.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {filter === "CONFIRMED" && (
                                            <>
                                                <Button size="sm" variant="outline" className="text-green-500 border-green-500/30 hover:bg-green-500/10">Finalizar</Button>
                                                <Button size="sm" variant="ghost" className="text-red-500">Cancelar</Button>
                                            </>
                                        )}
                                        <Badge className="bg-secondary text-gray-300">{booking.status}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-secondary rounded-xl">
                            Nenhum agendamento nesta categoria.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}