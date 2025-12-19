"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@barbergo/ui"
import { Calendar } from "@barbergo/ui"
import { Button, Card, CardContent, Avatar, AvatarImage, AvatarFallback } from "@barbergo/ui"
import { Barbershop, BarbershopService, BarberStaff } from "@prisma/client"
import { useState, useMemo, useEffect } from "react"
import { addMinutes, format, isPast, setHours, setMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { Loader2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { getDayBookings } from "@/_actions/get-day-bookings"
import { saveBooking } from "@/_actions/save-booking"

// Tipo auxiliar para incluir os barbeiros na barbearia
type BarbershopWithStaff = Barbershop & { staff: BarberStaff[] }
type ServiceWithNumberPrice = Omit<BarbershopService, "price"> & { price: number }

interface BookingSheetProps {
    services: ServiceWithNumberPrice[]
    barbershop: BarbershopWithStaff
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export default function BookingSheet({ services, barbershop, isOpen, onOpenChange }: BookingSheetProps) {
    const { data: session } = useSession()
    const router = useRouter()

    const [date, setDate] = useState<Date | undefined>(undefined)
    const [selectedBarber, setSelectedBarber] = useState<BarberStaff | undefined>(undefined)
    const [hour, setHour] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)
    const [dayBookings, setDayBookings] = useState<any[]>([])

    // URL da imagem padrão para barbeiros sem foto
    const DEFAULT_BARBER_IMAGE = "https://static.vecteezy.com/ti/vetor-gratis/p1/46533466-volta-pessoa-botao-icone-conta-e-meu-pagina-botao-vetor.jpg"

    // Cálculos de Totais
    const totalDuration = useMemo(() => {
        return services.reduce((acc, service) => acc + service.duration, 0)
    }, [services])

    const totalPrice = useMemo(() => {
        return services.reduce((acc, service) => acc + service.price, 0)
    }, [services])

    // Busca agendamentos do dia quando a data ou o barbeiro mudam
    useEffect(() => {
        if (!date) return

        const refreshAvailableHours = async () => {
            // Se tiver barbeiro selecionado, passamos o ID dele para a action
            const bookings = await getDayBookings(barbershop.id, date, selectedBarber?.id)
            setDayBookings(bookings)
        }
        refreshAvailableHours()
        setHour(undefined) // Reseta o horário ao mudar barbeiro ou data
    }, [date, barbershop.id, selectedBarber])

    const timeList = useMemo(() => {
        if (!date || !selectedBarber) return []

        const openHour = 9
        const closeHour = 21
        const interval = 15

        const timeList: string[] = []
        let currentTime = setMinutes(setHours(date, openHour), 0)
        const endTime = setMinutes(setHours(date, closeHour), 0)

        while (currentTime < endTime) {
            const slotStart = currentTime
            const slotEnd = addMinutes(currentTime, totalDuration)

            if (slotEnd > endTime) break

            const isBusy = dayBookings.some((booking) => {
                const bookingStart = new Date(booking.date)
                const bookingEnd = addMinutes(bookingStart, booking.service.duration)
                return slotEnd > bookingStart && slotStart < bookingEnd
            })

            const isTimePast = isPast(slotStart)

            if (!isBusy && !isTimePast) {
                timeList.push(format(slotStart, "HH:mm"))
            }

            currentTime = addMinutes(currentTime, interval)
        }
        return timeList
    }, [date, dayBookings, totalDuration, selectedBarber])

    const handleBookingSubmit = async () => {
        if (!date || !hour || !session?.user || !selectedBarber) return

        try {
            setIsLoading(true)
            const dateHour = Number(hour.split(":")[0])
            const dateMinutes = Number(hour.split(":")[1])
            const newDate = setMinutes(setHours(date, dateHour), dateMinutes)

            await saveBooking({
                serviceIds: services.map(s => s.id),
                barbershopId: barbershop.id,
                staffId: selectedBarber.id, // Enviamos o ID do barbeiro escolhido
                date: newDate,
                userId: session.user.id,
            })

            onOpenChange(false)
            toast.success("Reserva realizada com sucesso!")
            router.push("/appointments")
        } catch (error) {
            console.error(error)
            toast.error("Erro ao realizar reserva.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[90%] md:w-[450px] bg-[#141518] border-l border-[#26272B] p-0 text-white overflow-y-auto">
                <SheetHeader className="p-5 border-b border-[#26272B]">
                    <SheetTitle className="text-white font-bold text-left">Concluir Agendamento</SheetTitle>
                </SheetHeader>

                <div className="py-6 px-5 space-y-6">
                    {/* 1. SELEÇÃO DE DATA */}
                    <div>
                        <h2 className="text-xs uppercase text-gray-400 font-bold mb-3">1. Escolha a data</h2>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            locale={ptBR}
                            className="rounded-xl border border-[#26272B] bg-[#1A1B1F] p-5 w-full"
                            fromDate={new Date()}
                            classNames={{
                                month: "space-y-4 w-full",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex w-full justify-between",
                                row: "flex w-full mt-2 justify-between",
                                head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                                cell: "h-9 w-full text-center text-sm p-0 relative focus-within:z-20",
                                day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground",
                            }}
                        />
                    </div>

                    {/* 2. SELEÇÃO DE BARBEIRO (Só aparece se tiver data) */}
                    {date && (
                        <div>
                            <h2 className="text-xs uppercase text-gray-400 font-bold mb-3">2. Escolha o Profissional</h2>
                            <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                                {barbershop.staff?.filter(s => s.isActive).map((barber) => (
                                    <button
                                        key={barber.id}
                                        onClick={() => setSelectedBarber(barber)}
                                        className={`flex flex-col items-center gap-2 min-w-[100px] p-4 rounded-xl border transition-all ${selectedBarber?.id === barber.id
                                                ? "bg-primary/10 border-primary"
                                                : "bg-[#1A1B1F] border-[#26272B] hover:border-gray-600"
                                            }`}
                                    >
                                        <div className={`relative p-1 rounded-full border-2 ${selectedBarber?.id === barber.id ? "border-primary" : "border-transparent"}`}>
                                            <Avatar className="h-14 w-14">
                                                <AvatarImage src={barber.imageUrl || DEFAULT_BARBER_IMAGE} className="object-cover" />
                                                <AvatarFallback><User /></AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-sm font-bold truncate w-20 ${selectedBarber?.id === barber.id ? "text-primary" : "text-white"}`}>
                                                {barber.name.split(" ")[0]}
                                            </p>
                                            <p className="text-[10px] text-gray-500 uppercase font-medium">{barber.jobTitle}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. SELEÇÃO DE HORÁRIO (Só aparece se tiver barbeiro) */}
                    {date && selectedBarber && (
                        <div>
                            <h2 className="text-xs uppercase text-gray-400 font-bold mb-3">3. Escolha o Horário</h2>
                            <div className="flex gap-3 flex-wrap py-2">
                                {timeList.length > 0 ? timeList.map((time) => (
                                    <Button
                                        key={time}
                                        onClick={() => setHour(time)}
                                        variant={hour === time ? "default" : "outline"}
                                        className={`rounded-full border-[#26272B] min-w-[70px] ${hour === time ? "bg-primary text-white" : "bg-[#1A1B1F] text-gray-400 hover:bg-[#26272B]"
                                            }`}
                                    >
                                        {time}
                                    </Button>
                                )) : (
                                    <p className="text-sm text-gray-400 bg-[#1A1B1F] p-4 rounded-xl border border-dashed border-[#26272B] w-full text-center">
                                        {selectedBarber.name} não tem horários livres para {totalDuration} min nesta data.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RESUMO E CONFIRMAÇÃO */}
                    {date && hour && selectedBarber && (
                        <Card className="bg-[#1A1B1F] border-[#26272B] rounded-xl">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center gap-3 pb-3 border-b border-[#26272B]">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedBarber.imageUrl || DEFAULT_BARBER_IMAGE} />
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold text-white">{selectedBarber.name}</p>
                                        <p className="text-xs text-primary">{selectedBarber.jobTitle}</p>
                                    </div>
                                </div>

                                {services.map((service) => (
                                    <div key={service.id} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">{service.name}</span>
                                        <span className="text-white font-bold">
                                            {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.price)}
                                        </span>
                                    </div>
                                ))}

                                <div className="pt-3 border-t border-[#26272B] space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Data e Hora</span>
                                        <span className="text-white capitalize">
                                            {format(date, "dd/MM")} às {hour}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2">
                                        <span className="text-white">Total ({totalDuration} min)</span>
                                        <span className="text-primary">
                                            {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPrice)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Button
                        onClick={handleBookingSubmit}
                        disabled={!date || !hour || !selectedBarber || isLoading}
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold text-md transition-all active:scale-95"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Finalizar Agendamento
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}