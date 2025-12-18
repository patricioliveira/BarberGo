"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@barbergo/ui"
import { Calendar } from "@barbergo/ui"
import { Button, Card, CardContent } from "@barbergo/ui"
import { Barbershop, BarbershopService } from "@prisma/client"
import { useState, useMemo, useEffect } from "react"
import { addMinutes, format, isPast, setHours, setMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSession, signIn } from "next-auth/react"
import { toast } from "sonner"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { getDayBookings } from "@/_actions/get-day-bookings"
import { saveBooking } from "@/_actions/save-booking"

// Tipo auxiliar para serviços com preço numérico
type ServiceWithNumberPrice = Omit<BarbershopService, "price"> & { price: number }

interface BookingSheetProps {
    services: ServiceWithNumberPrice[] // RECEBE ARRAY AGORA
    barbershop: Barbershop
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export default function BookingSheet({ services, barbershop, isOpen, onOpenChange }: BookingSheetProps) {
    const { data: session } = useSession()
    const router = useRouter()

    const [date, setDate] = useState<Date | undefined>(undefined)
    const [hour, setHour] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)
    const [dayBookings, setDayBookings] = useState<any[]>([])

    // Cálculos de Totais
    const totalDuration = useMemo(() => {
        return services.reduce((acc, service) => acc + service.duration, 0)
    }, [services])

    const totalPrice = useMemo(() => {
        return services.reduce((acc, service) => acc + service.price, 0)
    }, [services])

    useEffect(() => {
        if (!date) return
        const refreshAvailableHours = async () => {
            const bookings = await getDayBookings(barbershop.id, date)
            setDayBookings(bookings)
        }
        refreshAvailableHours()
    }, [date, barbershop.id])

    const timeList = useMemo(() => {
        if (!date) return []
        const openHour = 9
        const closeHour = 21
        const interval = 15

        const timeList: string[] = []
        let currentTime = setMinutes(setHours(date, openHour), 0)
        const endTime = setMinutes(setHours(date, closeHour), 0)

        while (currentTime < endTime) {
            const slotStart = currentTime
            // USA A DURAÇÃO TOTAL DOS SERVIÇOS SELECIONADOS
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
    }, [date, dayBookings, totalDuration])

    const handleBookingSubmit = async () => {
        if (!date || !hour || !session?.user) return

        try {
            setIsLoading(true)
            const dateHour = Number(hour.split(":")[0])
            const dateMinutes = Number(hour.split(":")[1])
            const newDate = setMinutes(setHours(date, dateHour), dateMinutes)

            await saveBooking({
                serviceIds: services.map(s => s.id), // Envia array de IDs
                barbershopId: barbershop.id,
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
            <SheetContent className="w-[90%] md:w-[400px] bg-[#141518] border-l border-[#26272B] p-0 text-white overflow-y-auto">
                <SheetHeader className="p-5 border-b border-[#26272B]">
                    <SheetTitle className="text-white font-bold text-left">Fazer Reserva</SheetTitle>
                </SheetHeader>

                <div className="py-6 px-5">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        locale={ptBR}
                        className="mb-6 rounded-xl border border-[#26272B] bg-[#1A1B1F] p-5"
                        fromDate={new Date()}
                        classNames={{
                            month: "space-y-4 w-full",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex w-full justify-between",
                            row: "flex w-full mt-2 justify-between",
                            head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                            cell: "h-9 w-full text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground",
                        }}
                    />

                    {date && (
                        <div className="flex gap-3 flex-wrap py-2 mb-6">
                            {timeList.length > 0 ? timeList.map((time) => (
                                <Button
                                    key={time}
                                    onClick={() => setHour(time)}
                                    variant={hour === time ? "default" : "outline"}
                                    className={`rounded-full border-[#26272B] ${hour === time ? "bg-primary text-white" : "bg-[#1A1B1F] text-gray-400 hover:bg-[#26272B]"}`}
                                >
                                    {time}
                                </Button>
                            )) : (
                                <p className="text-sm text-gray-400">Não há horários disponíveis para a duração total ({totalDuration} min).</p>
                            )}
                        </div>
                    )}

                    {/* RESUMO DOS SERVIÇOS SELECIONADOS */}
                    {date && hour && (
                        <Card className="bg-[#1A1B1F] border-none rounded-xl mb-6">
                            <CardContent className="p-4 space-y-3">
                                {services.map((service) => (
                                    <div key={service.id} className="flex justify-between items-center pb-2 border-b border-[#26272B] last:border-0">
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{service.name}</h3>
                                            <span className="text-xs text-gray-400">{service.duration} min</span>
                                        </div>
                                        <h3 className="font-bold text-white text-sm">
                                            {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.price)}
                                        </h3>
                                    </div>
                                ))}

                                <div className="pt-2 space-y-2 text-sm mt-4 border-t border-[#26272B]">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Data</span>
                                        <span className="text-white capitalize">{format(date, "dd 'de' MMMM", { locale: ptBR })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Horário</span>
                                        <span className="text-white">{hour}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Barbearia</span>
                                        <span className="text-white">{barbershop.name}</span>
                                    </div>

                                    {/* TOTAIS FINAIS */}
                                    <div className="flex justify-between pt-3 border-t border-[#26272B]">
                                        <span className="font-bold text-gray-400">Tempo Total</span>
                                        <span className="font-bold text-white">{totalDuration} min</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-gray-400">Total a pagar</span>
                                        <span className="font-bold text-primary">
                                            {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPrice)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Button
                        onClick={handleBookingSubmit}
                        disabled={!date || !hour || isLoading}
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold text-md"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Reserva
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}