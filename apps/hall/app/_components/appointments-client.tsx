"use client"

import { useState } from "react"
import { Booking, Barbershop, BarbershopService, BarberStaff, User as PrismaUser } from "@prisma/client"
import {
    Card, CardContent, Button, Badge, Avatar, AvatarImage, AvatarFallback,
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from "@barbergo/ui"
import {
    MapPinIcon, PhoneIcon, UserIcon, CalendarIcon,
    ClockIcon, CopyIcon, ChevronRight, TimerIcon, XCircleIcon, CheckCircle2,
    CalendarX2, AlertCircle
} from "lucide-react"
import { format, isFuture, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"
import { toast } from "sonner"
import { requestCancellation } from "@/_actions/cancel-booking"
import Link from "next/link"

type BookingWithDetails = Booking & {
    service: Omit<BarbershopService, "price"> & { price: number }
    barbershop: Barbershop
    staff: (BarberStaff & { user?: PrismaUser | null }) | null
}

interface AppointmentsClientProps {
    initialBookings: BookingWithDetails[]
}

export default function AppointmentsClient({ initialBookings }: AppointmentsClientProps) {
    const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(
        initialBookings.length > 0 ? initialBookings[0] : null
    )
    const [isCancelling, setIsCancelling] = useState(false)

    if (initialBookings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-5 text-center">
                <div className="bg-[#1A1B1F] p-8 rounded-full mb-6 ring-1 ring-white/10 shadow-2xl">
                    <CalendarX2 size={64} className="text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Nenhum agendamento encontrado</h2>
                <p className="text-gray-400 max-w-[350px] mb-8">Você ainda não realizou nenhum agendamento.</p>
                <Button asChild className="rounded-xl px-8 font-bold"><Link href="/">Agendar agora</Link></Button>
            </div>
        )
    }

    const handleCancelRequest = async (id: string) => {
        try {
            setIsCancelling(true)
            await requestCancellation(id)
            toast.success("Solicitação de cancelamento enviada!")
        } catch (error) {
            toast.error("Erro ao solicitar cancelamento.")
        } finally {
            setIsCancelling(false)
        }
    }

    const upcoming = initialBookings.filter(b => isFuture(new Date(b.date)) && b.status !== "CANCELED")
    const past = initialBookings.filter(b => !isFuture(new Date(b.date)) || b.status === "CANCELED")

    const DetailsContent = ({ booking }: { booking: BookingWithDetails }) => (
        <div className="space-y-6">
            <div className="relative h-40 rounded-[24px] overflow-hidden border border-white/5">
                <Image src="/map.png" fill alt="Map" className="object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1B1F] to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-xl"><MapPinIcon size={20} className="text-white" /></div>
                    <div>
                        <p className="text-white font-bold text-sm leading-none">{booking.barbershop.name}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{booking.barbershop.address}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white leading-tight">{booking.service.name}</h2>
                    <div className="flex gap-2 mt-2">
                        {booking.status === "WAITING_CANCELLATION" ? (
                            <Badge className="bg-amber-500/10 text-amber-500 border-none flex items-center gap-1">
                                <TimerIcon size={12} className="animate-spin" /> Aguardando Cancelamento
                            </Badge>
                        ) : booking.status === "CANCELED" ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <XCircleIcon size={12} /> Cancelado
                            </Badge>
                        ) : (
                            <Badge className="bg-primary/10 text-primary border-none flex items-center gap-1">
                                {isFuture(new Date(booking.date)) ? <CheckCircle2 size={12} /> : <CheckCircle2 size={12} />}
                                {isFuture(new Date(booking.date)) ? "Confirmado" : "Finalizado"}
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-gray-500 text-[10px] font-bold uppercase">Total</p>
                    <p className="text-2xl font-black text-white">
                        {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(booking.service.price)}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                <Avatar className="h-12 w-12 border border-primary/20">
                    <AvatarImage src={booking.staff?.user?.image || booking.staff?.imageUrl || ""} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Profissional</p>
                    <p className="text-sm font-bold text-white">{booking.staff?.name}</p>
                    <p className="text-[10px] text-primary">{booking.staff?.jobTitle}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                    <CalendarIcon size={16} className="text-primary mb-2" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Data</p>
                    <p className="text-xs text-white font-bold capitalize">{format(new Date(booking.date), "dd 'de' MMMM", { locale: ptBR })}</p>
                </div>
                <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                    <ClockIcon size={16} className="text-primary mb-2" />
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Horário</p>
                    <p className="text-xs text-white font-bold">{format(new Date(booking.date), "HH:mm")}</p>
                </div>
            </div>

            {/* Lógica de botões ajustada */}
            {isFuture(new Date(booking.date)) && booking.status === "CONFIRMED" && (
                <Button
                    variant="destructive"
                    className="w-full h-12 rounded-xl font-bold transition-all active:scale-95"
                    onClick={() => handleCancelRequest(booking.id)}
                    disabled={isCancelling}
                >
                    Solicitar Cancelamento
                </Button>
            )}

            {booking.status === "WAITING_CANCELLATION" && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <TimerIcon className="text-amber-500 animate-spin" size={20} />
                        <p className="text-sm font-bold text-amber-500">Solicitação em análise</p>
                    </div>
                    <p className="text-[11px] text-amber-200/60 leading-relaxed">
                        O barbeiro foi notificado. Enquanto ele não aceitar, seu horário permanece reservado.
                    </p>
                    <Button disabled className="w-full mt-2 bg-amber-500/20 text-amber-500 border-amber-500/30">
                        Aguardando Aprovação...
                    </Button>
                </div>
            )}

            {booking.status === "CANCELED" && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <p className="text-xs text-red-200">Este agendamento foi cancelado e o horário liberado.</p>
                </div>
            )}
        </div>
    )

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                {/* PRÓXIMOS */}
                {upcoming.length > 0 && (
                    <section>
                        <h3 className="text-xs font-black uppercase text-primary tracking-widest mb-4">Próximos</h3>
                        {upcoming.map(b => (
                            <div key={b.id}>
                                <div className="lg:hidden">
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <div onClick={() => setSelectedBooking(b)}><AppointmentCard booking={b} active={selectedBooking?.id === b.id} /></div>
                                        </SheetTrigger>
                                        <SheetContent side="bottom" className="bg-[#141518] border-none rounded-t-[32px] h-[85vh] text-white">
                                            <SheetHeader className="mb-6 px-2"><SheetTitle className="text-white text-left">Detalhes da Reserva</SheetTitle></SheetHeader>
                                            <div className="overflow-y-auto h-full pb-10 px-2"><DetailsContent booking={b} /></div>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                                <div className="hidden lg:block">
                                    <AppointmentCard booking={b} active={selectedBooking?.id === b.id} onClick={() => setSelectedBooking(b)} />
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* HISTÓRICO - Corrigido para mostrar Detalhes no Mobile */}
                {past.length > 0 && (
                    <section>
                        <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-4">Histórico</h3>
                        {past.map(b => (
                            <div key={b.id}>
                                <div className="lg:hidden">
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <div onClick={() => setSelectedBooking(b)}><AppointmentCard booking={b} active={selectedBooking?.id === b.id} /></div>
                                        </SheetTrigger>
                                        <SheetContent side="bottom" className="bg-[#141518] border-none rounded-t-[32px] h-[85vh] text-white">
                                            <SheetHeader className="mb-6 px-2"><SheetTitle className="text-white text-left">Resumo do Serviço</SheetTitle></SheetHeader>
                                            <div className="overflow-y-auto h-full pb-10 px-2"><DetailsContent booking={b} /></div>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                                <div className="hidden lg:block">
                                    <AppointmentCard booking={b} active={selectedBooking?.id === b.id} onClick={() => setSelectedBooking(b)} />
                                </div>
                            </div>
                        ))}
                    </section>
                )}
            </div>

            <div className="hidden lg:block lg:col-span-7 xl:col-span-8 sticky top-8">
                {selectedBooking && <Card className="bg-[#1A1B1F] border-none ring-1 ring-white/5 rounded-[32px] p-8 shadow-2xl"><DetailsContent booking={selectedBooking} /></Card>}
            </div>
        </div>
    )
}

function AppointmentCard({ booking, active, onClick }: { booking: BookingWithDetails, active: boolean, onClick?: () => void }) {
    const date = new Date(booking.date)
    return (
        <button onClick={onClick} className={`w-full text-left p-4 rounded-2xl mb-3 transition-all border flex items-center gap-4 ${active ? "bg-[#26272B] border-primary translate-x-1" : "bg-[#1A1B1F] border-transparent hover:bg-[#202125]"}`}>
            <div className={`flex flex-col items-center justify-center min-w-[50px] h-12 rounded-xl ${active ? 'bg-primary text-white' : 'bg-black/40 text-gray-500'}`}>
                <span className="text-[9px] font-bold uppercase">{format(date, "MMM", { locale: ptBR })}</span>
                <span className="text-lg font-bold">{format(date, "dd")}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-sm truncate ${booking.status === 'CANCELED' ? 'line-through text-gray-600' : 'text-white'}`}>{booking.service.name}</h4>
                    {booking.status === "WAITING_CANCELLATION" && <TimerIcon size={12} className="text-amber-500 animate-pulse" />}
                    {booking.status === "CANCELED" && <XCircleIcon size={12} className="text-red-500" />}
                </div>
                <p className="text-xs text-gray-500 truncate">{booking.barbershop.name}</p>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold text-white">{format(date, "HH:mm")}</p>
                <ChevronRight size={14} className="text-gray-700" />
            </div>
        </button>
    )
}