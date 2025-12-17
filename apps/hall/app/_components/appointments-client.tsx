"use client"

import { useState } from "react"
import { Booking, Barbershop, BarbershopService } from "@prisma/client"
import { Card, CardContent, Button, Badge } from "@barbergo/ui"
import { CalendarIcon, MapPinIcon, PhoneIcon } from "lucide-react"
import { format, isFuture } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"
import { toast } from "sonner"

// Tipagem estendida para incluir as relações
type BookingWithDetails = Booking & {
    service: BarbershopService
    barbershop: Barbershop
}

interface AppointmentsClientProps {
    initialBookings: BookingWithDetails[]
}

const AppointmentsClient = ({ initialBookings }: AppointmentsClientProps) => {
    // Estado para o agendamento selecionado (inicia com o primeiro da lista, se existir)
    const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(
        initialBookings.length > 0 ? initialBookings[0] : null
    )

    const confirmedBookings = initialBookings.filter(b => isFuture(new Date(b.date)))
    const finishedBookings = initialBookings.filter(b => !isFuture(new Date(b.date)))

    const handleCancel = () => {
        // Aqui você implementará a Server Action ou API Call para cancelar
        toast.info("Função de cancelar será implementada em breve.")
    }

    // Componente de Item da Lista
    const BookingItem = ({ booking }: { booking: BookingWithDetails }) => {
        const isSelected = selectedBooking?.id === booking.id
        return (
            <button
                onClick={() => setSelectedBooking(booking)}
                className={`w-full text-left rounded-xl p-3 mb-3 transition-all ${isSelected ? "bg-[#26272B] border border-primary/50" : "bg-[#1A1B1F] hover:bg-[#26272B]"
                    }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 min-w-[40px] rounded-full overflow-hidden border border-[#26272B]">
                            <Image src={booking.barbershop.imageUrl} fill alt={booking.barbershop.name} className="object-cover" />
                        </div>
                        <div>
                            <Badge variant={isFuture(new Date(booking.date)) ? "default" : "secondary"} className="mb-1 text-[10px] px-2 h-5">
                                {isFuture(new Date(booking.date)) ? "Confirmado" : "Finalizado"}
                            </Badge>
                            <h4 className="font-bold text-sm text-white truncate max-w-[150px]">{booking.service.name}</h4>
                            <p className="text-xs text-gray-400">{booking.barbershop.name}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 capitalize">{format(new Date(booking.date), "MMMM", { locale: ptBR })}</p>
                        <p className="font-bold text-sm text-white">{format(new Date(booking.date), "dd")} <span className="text-xs font-normal text-gray-400">{format(new Date(booking.date), "HH:mm")}</span></p>
                    </div>
                </div>
            </button>
        )
    }

    if (initialBookings.length === 0) {
        return <div className="text-center text-gray-500 mt-10">Você ainda não tem agendamentos.</div>
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">

            {/* ESQUERDA: LISTA (Scrollável) */}
            <div className="w-full lg:w-1/3 overflow-y-auto pr-2 custom-scrollbar">
                {confirmedBookings.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">Confirmados</h3>
                        {confirmedBookings.map(booking => <BookingItem key={booking.id} booking={booking} />)}
                    </div>
                )}

                {finishedBookings.length > 0 && (
                    <div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-3 ml-1">Finalizados</h3>
                        {finishedBookings.map(booking => <BookingItem key={booking.id} booking={booking} />)}
                    </div>
                )}
            </div>

            {/* DIREITA: DETALHES (Fixo no Desktop, Modal/Página no Mobile se quiser refinar) */}
            {selectedBooking && (
                <div className="hidden lg:block w-full lg:w-2/3 bg-[#1A1B1F] rounded-2xl p-6 h-full border border-[#26272B]">
                    {/* Mapa (Imagem estática por enquanto) */}
                    <div className="relative w-full h-40 rounded-xl overflow-hidden mb-5">
                        <Image src="/map.png" fill alt="Mapa" className="object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Button variant="secondary" size="sm" className="gap-2 pointer-events-none">
                                <MapPinIcon size={14} /> Ver no mapa
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedBooking.barbershop.name}</h2>
                            <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                                <MapPinIcon size={14} /> {selectedBooking.barbershop.address}
                            </p>
                        </div>
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-[#26272B]">
                            <Image src={selectedBooking.barbershop.imageUrl} fill alt="Avatar" className="object-cover" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-white font-bold text-sm mb-2">SOBRE NÓS</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {selectedBooking.barbershop.description || "Descrição da barbearia indisponível."}
                            </p>
                        </div>

                        {/* Contatos */}
                        <div className="flex gap-3">
                            {selectedBooking.barbershop.phones.map((phone, idx) => (
                                <Button key={idx} variant="outline" className="bg-[#141518] border-[#26272B] gap-2">
                                    <PhoneIcon size={14} /> {phone}
                                </Button>
                            ))}
                        </div>

                        {/* Card de Resumo do Agendamento */}
                        <div className="bg-[#141518] p-5 rounded-xl border border-[#26272B]">
                            <div className="flex items-center justify-between mb-4">
                                <Badge variant={isFuture(new Date(selectedBooking.date)) ? "default" : "secondary"}>
                                    {isFuture(new Date(selectedBooking.date)) ? "Confirmado" : "Finalizado"}
                                </Badge>
                                <span className="font-bold text-primary">
                                    {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(selectedBooking.service.price))}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Serviço</span>
                                    <span className="font-bold text-white">{selectedBooking.service.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Data</span>
                                    <span className="text-white">{format(new Date(selectedBooking.date), "dd 'de' MMMM", { locale: ptBR })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Horário</span>
                                    <span className="text-white">{format(new Date(selectedBooking.date), "HH:mm")}</span>
                                </div>
                            </div>

                            {isFuture(new Date(selectedBooking.date)) && (
                                <Button
                                    variant="destructive"
                                    className="w-full mt-6 font-bold"
                                    onClick={handleCancel}
                                >
                                    Cancelar Reserva
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AppointmentsClient