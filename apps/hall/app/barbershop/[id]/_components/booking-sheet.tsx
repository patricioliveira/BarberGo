"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@barbergo/ui"
import { Calendar } from "@barbergo/ui"
import { Button, Card, CardContent, Avatar, AvatarImage, AvatarFallback } from "@barbergo/ui"
import { Barbershop, BarbershopService, BarberStaff, User as PrismaUser } from "@prisma/client"
import { useState, useMemo, useEffect, useRef } from "react"
import { addMinutes, format, isPast, setHours, setMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { Loader2, User as UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { getDayBookings } from "@/_actions/get-day-bookings"
import { saveBooking } from "@/_actions/save-booking"

// Tipo estendido para garantir que o TS reconheça o utilizador incluído
type StaffWithUser = BarberStaff & { user?: PrismaUser | null }
type BarbershopWithStaff = Barbershop & { staff: StaffWithUser[] }
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
    const barberScrollRef = useRef<HTMLDivElement>(null)

    const [date, setDate] = useState<Date | undefined>(undefined)
    const [selectedBarber, setSelectedBarber] = useState<StaffWithUser | undefined>(undefined)
    const [hour, setHour] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)
    const [dayBookings, setDayBookings] = useState<any[]>([])

    const DEFAULT_BARBER_IMAGE = "https://static.vecteezy.com/ti/vetor-gratis/p1/46533466-volta-pessoa-botao-icone-conta-e-meu-pagina-botao-vetor.jpg"

    // 1. Rolagem Horizontal via Mouse
    useEffect(() => {
        const el = barberScrollRef.current
        if (!el) return
        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault()
                el.scrollLeft += e.deltaY
            }
        }
        el.addEventListener("wheel", handleWheel, { passive: false })
        return () => el.removeEventListener("wheel", handleWheel)
    }, [date])

    const totalDuration = useMemo(() => services.reduce((acc, s) => acc + s.duration, 0), [services])
    const totalPrice = useMemo(() => services.reduce((acc, s) => acc + s.price, 0), [services])

    useEffect(() => {
        if (!date) return
        const refreshAvailableHours = async () => {
            try {
                const bookings = await getDayBookings(barbershop.id, date, selectedBarber?.id)
                setDayBookings(bookings)
            } catch (error) {
                console.error("Erro ao carregar agendamentos:", error)
            }
        }
        refreshAvailableHours()
        setHour(undefined)
    }, [date, barbershop.id, selectedBarber])

    const timeList = useMemo(() => {
        if (!date || !selectedBarber) return []
        const openHour = 9
        const closeHour = 21
        const interval = 15
        const list: string[] = []
        let currentTime = setMinutes(setHours(date, openHour), 0)
        const endTime = setMinutes(setHours(date, closeHour), 0)

        while (currentTime < endTime) {
            const slotStart = currentTime
            const slotEnd = addMinutes(currentTime, totalDuration)
            if (slotEnd > endTime) break
            const isBusy = dayBookings.some((booking) => {
                const bStart = new Date(booking.date)
                const bEnd = addMinutes(bStart, booking.service.duration)
                return slotEnd > bStart && slotStart < bEnd
            })
            if (!isBusy && !isPast(slotStart)) {
                list.push(format(slotStart, "HH:mm"))
            }
            currentTime = addMinutes(currentTime, interval)
        }
        return list
    }, [date, dayBookings, totalDuration, selectedBarber])

    const handleBookingSubmit = async () => {
        if (!date || !hour || !session?.user || !selectedBarber) return
        try {
            setIsLoading(true)
            const [h, m] = hour.split(":").map(Number)
            const newDate = setMinutes(setHours(date, h), m)
            await saveBooking({
                serviceIds: services.map(s => s.id),
                barbershopId: barbershop.id,
                staffId: selectedBarber.id,
                date: newDate,
                userId: session.user.id,
            })
            onOpenChange(false)
            toast.success("Reserva realizada com sucesso!")
            router.push("/appointments")
        } catch (error) {
            toast.error("Erro ao realizar reserva.")
        } finally {
            setIsLoading(false)
        }
    }

    const activeStaff = barbershop.staff?.filter(s => s.isActive) || []

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[90%] md:w-[450px] bg-[#141518] border-l border-[#26272B] p-0 text-white overflow-y-auto">
                <SheetHeader className="p-5 border-b border-[#26272B]">
                    <SheetTitle className="text-white font-bold text-left">Concluir Agendamento</SheetTitle>
                </SheetHeader>

                <div className="py-6 px-5 space-y-6">
                    {/* DATA */}
                    <div>
                        <h2 className="text-xs uppercase text-gray-400 font-bold mb-3">1. Escolha a data</h2>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            locale={ptBR}
                            className="rounded-xl border border-[#26272B] bg-[#1A1B1F] p-5 w-full"
                            fromDate={new Date()}
                        />
                    </div>

                    {/* BARBEIRO COM FOTO PRIORITÁRIA DO GOOGLE */}
                    {date && (
                        <div>
                            <h2 className="text-xs uppercase text-gray-400 font-bold mb-3">2. Escolha o Profissional</h2>
                            <div
                                ref={barberScrollRef}
                                className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden flex-nowrap"
                            >
                                {activeStaff.map((barber) => (
                                    <button
                                        key={barber.id}
                                        onClick={() => setSelectedBarber(barber)}
                                        className={`flex flex-col items-center gap-2 min-w-[100px] p-4 rounded-xl border transition-all ${selectedBarber?.id === barber.id ? "bg-primary/10 border-primary" : "bg-[#1A1B1F] border-[#26272B]"
                                            }`}
                                    >
                                        <div className={`relative p-1 rounded-full border-2 ${selectedBarber?.id === barber.id ? "border-primary" : "border-transparent"}`}>
                                            <Avatar className="h-14 w-14">
                                                {/* Lógica: Foto do Google > Foto do Banco > Default */}
                                                <AvatarImage
                                                    src={barber.user?.image || barber.imageUrl || DEFAULT_BARBER_IMAGE}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback><UserIcon /></AvatarFallback>
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

                    {/* GRID DE HORÁRIOS CORRIGIDA (4 COLUNAS) */}
                    {date && selectedBarber && (
                        <div>
                            <h2 className="text-xs uppercase text-gray-400 font-bold mb-3">3. Escolha o Horário</h2>
                            <div className="grid grid-cols-4 gap-2 py-2">
                                {timeList.length > 0 ? timeList.map((time) => (
                                    <Button
                                        key={time}
                                        onClick={() => setHour(time)}
                                        variant={hour === time ? "default" : "outline"}
                                        className={`rounded-full border-[#26272B] h-9 text-xs font-semibold ${hour === time ? "bg-primary text-white" : "bg-[#1A1B1F] text-gray-400 hover:bg-[#26272B]"
                                            }`}
                                    >
                                        {time}
                                    </Button>
                                )) : (
                                    <p className="col-span-4 text-sm text-gray-400 bg-[#1A1B1F] p-4 rounded-xl border border-dashed border-[#26272B] text-center">
                                        Sem horários disponíveis.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RESUMO */}
                    {date && hour && selectedBarber && (
                        <Card className="bg-[#1A1B1F] border-[#26272B] rounded-xl">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center gap-3 pb-3 border-b border-[#26272B]">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedBarber.user?.image || selectedBarber.imageUrl || DEFAULT_BARBER_IMAGE} />
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold text-white">{selectedBarber.name}</p>
                                        <p className="text-xs text-primary">{selectedBarber.jobTitle}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Data e Horário</span>
                                    <span className="text-white capitalize">{format(date, "dd/MM")} às {hour}</span>
                                </div>
                                <div className="flex justify-between font-bold pt-2 border-t border-[#26272B]">
                                    <span className="text-white">Total</span>
                                    <span className="text-primary">{Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPrice)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Button
                        onClick={handleBookingSubmit}
                        disabled={!date || !hour || !selectedBarber || isLoading}
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold text-md"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Finalizar Agendamento
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}