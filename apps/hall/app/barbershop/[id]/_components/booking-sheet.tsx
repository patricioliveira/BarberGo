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

import { Loader2, User as UserIcon, CalendarIcon, ClockIcon, MapPinIcon, ScissorsIcon, Ban, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { getDayBookings } from "@/_actions/get-day-bookings"
import { saveBooking } from "@/_actions/save-booking"

type StaffWithUser = BarberStaff & { user?: PrismaUser | null }
type BarbershopWithStaff = Barbershop & { staff: StaffWithUser[] }
type ServiceWithNumberPrice = Omit<BarbershopService, "price"> & {
    price: number
    staffPrices?: { staffId: string; price: number; isLinked: boolean }[]
}

interface BookingSheetProps {
    services: ServiceWithNumberPrice[]
    barbershop: BarbershopWithStaff & { subscription?: any }
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
    const [observation, setObservation] = useState("")
    const [silentAppointment, setSilentAppointment] = useState(false)

    const DEFAULT_BARBER_IMAGE = "https://static.vecteezy.com/ti/vetor-gratis/p1/46533466-volta-pessoa-botao-icone-conta-e-meu-pagina-botao-vetor.jpg"

    // Bloqueios de Regra de Negócio
    const isBarbershopClosed = barbershop.isClosed
    const isSubscriptionSuspended = barbershop.subscription?.status === "SUSPENDED" || barbershop.subscription?.status === "CANCELED"
    const activeStaff = barbershop.staff?.filter(s => s.isActive) || []

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

    // Cálculo de Preço considerando Override por Barbeiro
    const totalPrice = useMemo(() => {
        return services.reduce((acc, s) => {
            if (selectedBarber && s.staffPrices) {
                const staffPrice = s.staffPrices.find(sp => sp.staffId === selectedBarber.id)
                if (staffPrice) return acc + Number(staffPrice.price)
            }
            return acc + s.price
        }, 0)
    }, [services, selectedBarber])


    // Identificar se há um barbeiro exclusivo para os serviços selecionados
    const exclusiveBarberId = useMemo(() => {
        // Como o barbershop-details já valida que todos os linked apontam pro mesmo, pegamos o primeiro
        const linked = services.find(s => s.staffPrices?.some(sp => sp.isLinked))
        if (linked) {
            return linked.staffPrices?.find(sp => sp.isLinked)?.staffId
        }
        return null
    }, [services])

    // Auto-seleção de Barbeiro Vinculado
    useEffect(() => {
        if (!isOpen) return

        if (exclusiveBarberId) {
            const staffMember = activeStaff.find(s => s.id === exclusiveBarberId)
            if (staffMember) {
                setSelectedBarber(staffMember)
            }
        }
    }, [isOpen, exclusiveBarberId, activeStaff])

    useEffect(() => {
        if (!date) return
        const refreshAvailableHours = async () => {
            try {
                const bookings = await getDayBookings(barbershop.id, date, selectedBarber?.id)
                setDayBookings(bookings)
            } catch (error) {
                console.error(error)
            }
        }
        refreshAvailableHours()
        setHour(undefined)
    }, [date, barbershop.id, selectedBarber])

    // Interface auxiliar
    interface WorkingHour {
        day: string
        open: string
        close: string
        isOpen: boolean
    }

    const timeList = useMemo(() => {
        if (!date || !selectedBarber) return []

        const weekDays = [
            "Domingo",
            "Segunda-feira",
            "Terça-feira",
            "Quarta-feira",
            "Quinta-feira",
            "Sexta-feira",
            "Sábado",
        ]
        const dayName = weekDays[date.getDay()]

        // Default horarios
        let startMin = 9 * 60
        let endMin = 21 * 60

        // Helper para converter "HH:MM" para minutos do dia
        const toMinutes = (timeString: string) => {
            const [h, m] = timeString.split(":").map(Number)
            return h * 60 + m
        }

        // 1. Horário da Barbearia
        if (barbershop.openingHours && Array.isArray(barbershop.openingHours)) {
            const hours = barbershop.openingHours as unknown as WorkingHour[]
            const shopSchedule = hours.find((h) => h.day === dayName)
            if (shopSchedule) {
                if (!shopSchedule.isOpen) return [] // Dia fechado
                startMin = toMinutes(shopSchedule.open)
                endMin = toMinutes(shopSchedule.close)
            }
        }

        // 2. Horário do Staff (Se existir, refinamos o intervalo - Interseção)
        if (selectedBarber.openingHours && Array.isArray(selectedBarber.openingHours)) {
            const hours = selectedBarber.openingHours as unknown as WorkingHour[]
            const staffSchedule = hours.find((h) => h.day === dayName)
            if (staffSchedule) {
                if (!staffSchedule.isOpen) return [] // Barbeiro não atende nesse dia
                const staffStart = toMinutes(staffSchedule.open)
                const staffEnd = toMinutes(staffSchedule.close)

                // Pega o maior inicio e o menor fim (Interseção)
                startMin = Math.max(startMin, staffStart)
                endMin = Math.min(endMin, staffEnd)
            }
        }

        const interval = 15 // min
        const list: string[] = []

        // Gerar slots
        let currentTime = setMinutes(setHours(date, 0), startMin) // Começa no minuto absoluto
        // Recalcular currentTime corretamente baseado em horas e minutos
        const startH = Math.floor(startMin / 60)
        const startM = startMin % 60
        currentTime = setMinutes(setHours(date, startH), startM)

        const endOfServiceLimit = setMinutes(setHours(date, Math.floor(endMin / 60)), endMin % 60)

        while (currentTime < endOfServiceLimit) {
            const slotStart = currentTime
            const slotEnd = addMinutes(currentTime, totalDuration)

            // Se allowOvertime for false (padrão antigo não tinha flag no front, assumimos false ou checamos backend na hora de salvar)
            // Mas aqui é display. Se não permitir overtime, o slotEnd não pode passar do limite.
            // Para simplificar e bater com a validação do backend:
            // Vamos assumir que se o usuário desabilitou overtime, NÃO mostramos slots que estouram.
            // Precisaríamos da flag allowOvertime vindo do backend no objeto barbershop.
            // Vou verificar se ele pode passar do horário final.

            // SE allowOvertime (que checamos no backend) for false, então slotEnd <= endOfServiceLimit
            const allowOvertime = (barbershop as any).allowOvertime

            if (!allowOvertime && slotEnd > endOfServiceLimit) {
                break
            }

            // Validação de colisão com agendamentos existentes
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
    }, [date, dayBookings, totalDuration, selectedBarber, barbershop.openingHours, barbershop])

    const handleBookingSubmit = async () => {
        if (!date || !hour || !session?.user || !selectedBarber) return
        try {
            setIsLoading(true)
            const [h, m] = hour.split(":").map(Number)
            const newDate = setMinutes(setHours(date, h), m)

            const result = await saveBooking({
                serviceIds: services.map(s => s.id),
                barbershopId: barbershop.id,
                staffId: selectedBarber.id,
                date: newDate,
                userId: session.user.id,
                observation,
                silentAppointment,
            })

            if (!result.success) {
                toast.error(result.message || "Erro ao realizar reserva.")
                return
            }

            onOpenChange(false)
            toast.success("Reserva realizada com sucesso!")
            router.push("/appointments")
        } catch (error: any) {
            toast.error("Erro inesperado ao realizar reserva.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[90%] md:w-[450px] bg-[#141518] border-l border-[#26272B] p-0 text-white overflow-y-auto custom-scrollbar">
                <SheetHeader className="p-5 border-b border-[#26272B]">
                    <SheetTitle className="text-white font-bold text-left">Concluir Agendamento</SheetTitle>
                </SheetHeader>

                <div className="py-6 px-5 space-y-8">
                    {/* AVISO 1: BARBEARIA FECHADA OU ASSINATURA SUSPENSA */}
                    {(isBarbershopClosed || isSubscriptionSuspended) ? (
                        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-2">
                            <Ban size={32} className="text-amber-500 mx-auto" />
                            <p className="text-sm font-bold text-white">Unidade Indisponível</p>
                            <p className="text-xs text-gray-400">
                                {isSubscriptionSuspended
                                    ? "Esta unidade está com agendamentos suspensos temporariamente."
                                    : "Esta barbearia encontra-se fechada no momento."}
                            </p>
                            <Button variant="outline" className="w-full mt-4 border-[#26272B]" onClick={() => onOpenChange(false)}>
                                Voltar
                            </Button>
                        </div>
                    ) : activeStaff.length === 0 ? (
                        /* AVISO 2: SEM PROFISSIONAIS ATIVOS */
                        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-2">
                            <UserIcon size={32} className="text-red-500 mx-auto" />
                            <p className="text-sm font-bold text-white">Sem barbeiros disponíveis</p>
                            <p className="text-xs text-gray-400">Não há profissionais ativos para agendamento nesta unidade no momento.</p>
                            <Button variant="outline" className="w-full mt-4 border-[#26272B]" onClick={() => onOpenChange(false)}>
                                Voltar
                            </Button>
                        </div>
                    ) : (
                        /* FLUXO NORMAL DE AGENDAMENTO */
                        <>
                            {/* 1. DATA */}
                            <div className="space-y-3">
                                <h2 className="text-xs uppercase text-gray-400 font-bold flex items-center gap-2">
                                    <CalendarIcon size={14} className="text-primary" /> 1. Escolha a data
                                </h2>
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    locale={ptBR}
                                    fromDate={new Date()}
                                    className="rounded-xl border border-[#26272B] bg-[#1A1B1F] p-4 w-full"
                                    classNames={{
                                        month: "space-y-4 w-full",
                                        table: "w-full border-collapse space-y-1",
                                        head_row: "flex w-full justify-between",
                                        row: "flex w-full mt-2 justify-between",
                                        head_cell: "text-gray-500 rounded-md w-full font-normal text-[0.8rem]",
                                        cell: "h-9 w-full text-center text-sm p-0 relative focus-within:z-20",
                                        day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-primary hover:text-white transition-all",
                                        nav_button: "hover:bg-secondary rounded-md transition-colors",
                                    }}
                                />
                            </div>

                            {/* 2. PROFISSIONAL */}
                            {date && (
                                <div className="space-y-3">
                                    <h2 className="text-xs uppercase text-gray-400 font-bold flex items-center gap-2">
                                        <UserIcon size={14} className="text-primary" /> 2. Escolha o Profissional
                                    </h2>
                                    <div
                                        ref={barberScrollRef}
                                        className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden flex-nowrap"
                                    >
                                        {activeStaff.map((barber) => {
                                            const isSelected = selectedBarber?.id === barber.id
                                            const isExclusive = exclusiveBarberId === barber.id
                                            const isLockedOut = exclusiveBarberId && !isExclusive

                                            return (
                                                <button
                                                    key={barber.id}
                                                    onClick={() => !isLockedOut && setSelectedBarber(barber)}
                                                    disabled={!!isLockedOut}
                                                    className={`flex flex-col items-center gap-2 w-[110px] min-w-[110px] p-4 rounded-xl border transition-all 
                                                        ${isSelected ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(129,91,64,0.1)]" : "bg-[#1A1B1F] border-[#26272B]"}
                                                        ${isLockedOut ? "opacity-30 grayscale cursor-not-allowed" : "hover:border-primary/50"}
                                                    `}
                                                >
                                                    <div className={`relative p-0.5 rounded-full border-2 ${isSelected ? "border-primary" : "border-transparent"}`}>
                                                        <Avatar className="h-12 w-12">
                                                            <AvatarImage src={barber.user?.image || barber.imageUrl || DEFAULT_BARBER_IMAGE} className="object-cover" />
                                                            <AvatarFallback><UserIcon /></AvatarFallback>
                                                        </Avatar>
                                                        {isExclusive && (
                                                            <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center shadow-sm">
                                                                <Lock size={8} className="mr-0.5" /> EXCLUSIVO
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-center w-full">
                                                        <p className={`text-xs font-bold truncate w-full ${isSelected ? "text-primary" : "text-white"}`}>
                                                            {barber.name}
                                                        </p>
                                                        <p className="text-[9px] text-gray-500 uppercase font-medium truncate w-full">{barber.jobTitle}</p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 3. HORÁRIO */}
                            {date && selectedBarber && (
                                <div className="space-y-3">
                                    <h2 className="text-xs uppercase text-gray-400 font-bold flex items-center gap-2">
                                        <ClockIcon size={14} className="text-primary" /> 3. Escolha o Horário
                                    </h2>
                                    <div className="grid grid-cols-4 gap-2 py-2">
                                        {timeList.length > 0 ? timeList.map((time) => (
                                            <Button
                                                key={time}
                                                onClick={() => setHour(time)}
                                                variant={hour === time ? "default" : "outline"}
                                                className={`rounded-full border-[#26272B] h-9 text-xs font-bold ${hour === time ? "bg-primary text-white" : "bg-[#1A1B1F] text-gray-400 hover:bg-[#26272B]"}`}
                                            >
                                                {time}
                                            </Button>
                                        )) : (
                                            <p className="col-span-4 text-xs text-gray-500 bg-[#1A1B1F] p-4 rounded-xl border border-dashed border-[#26272B] text-center">
                                                Indisponível nesta data.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 4. REVISÃO */}
                            {date && hour && selectedBarber && (
                                <div className="space-y-3">
                                    <h2 className="text-xs uppercase text-gray-400 font-bold">4. Revisão do Agendamento</h2>
                                    <Card className="bg-[#1A1B1F] border-[#26272B] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                                        <CardContent className="p-0">
                                            <div className="p-4 bg-gradient-to-r from-black/20 to-transparent flex items-center gap-3 border-b border-[#26272B]">
                                                <div className="p-2 bg-secondary rounded-lg"><MapPinIcon size={16} className="text-primary" /></div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{barbershop.name}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{barbershop.address}</p>
                                                </div>
                                            </div>

                                            <div className="p-5 space-y-4">
                                                <div className="space-y-2">
                                                    {services.map((service) => (
                                                        <div key={service.id} className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-400 flex items-center gap-2"><ScissorsIcon size={12} /> {service.name}</span>
                                                            <span className="text-white font-bold">
                                                                {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.price)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="h-[1px] w-full bg-white/5" />

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Profissional</p>
                                                        <p className="text-xs font-bold text-primary">{selectedBarber.name.split(" ")[0]}</p>
                                                    </div>
                                                    <div className="space-y-1 text-right">
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Duração Total</p>
                                                        <p className="text-xs font-bold text-white">{totalDuration} min</p>
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-black/30 rounded-xl flex items-center justify-between border border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon size={14} className="text-primary" />
                                                        <span className="text-xs font-bold text-white capitalize">{format(date, "dd 'de' MMMM", { locale: ptBR })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon size={14} className="text-primary" />
                                                        <span className="text-xs font-bold text-white">{hour}</span>
                                                    </div>
                                                </div>

                                                {/* OBSERVATION & SILENT APPOINTMENT */}
                                                <div className="space-y-3 pt-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Observação (Opcional)</label>
                                                        <textarea
                                                            className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 resize-none h-20"
                                                            placeholder="Alguma preferência especial? Ex: Cabelo mais curto na lateral..."
                                                            value={observation}
                                                            onChange={(e) => setObservation(e.target.value)}
                                                        />
                                                    </div>

                                                    <label className="flex items-start gap-3 p-3 bg-black/20 rounded-xl border border-white/5 cursor-pointer hover:bg-black/30 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={silentAppointment}
                                                            onChange={(e) => setSilentAppointment(e.target.checked)}
                                                            className="mt-0.5 accent-primary h-4 w-4 rounded-sm"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="text-xs font-bold text-white flex items-center gap-2">
                                                                Agendamento Silencioso 🤫
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                                                                Selecione se prefere evitar conversas durante o atendimento (exceto dúvidas necessárias).
                                                            </p>
                                                        </div>
                                                    </label>
                                                </div>

                                                <div className="pt-2 flex justify-between items-center border-t border-white/5 mt-2">
                                                    <span className="text-sm font-bold text-white">Valor a Pagar</span>
                                                    <span className="text-xl font-black text-primary">
                                                        {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPrice)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            <Button
                                onClick={handleBookingSubmit}
                                disabled={!date || !hour || !selectedBarber || isLoading}
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold text-md transition-all active:scale-95 shadow-lg shadow-primary/10"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar Agendamento
                            </Button>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}