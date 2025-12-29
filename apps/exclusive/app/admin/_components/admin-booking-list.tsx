"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@barbergo/ui"
import { Badge } from "@barbergo/ui"
import { Booking, BarbershopService, User, BarberStaff } from "@prisma/client"
import { format, isToday } from "date-fns"
import { Scissors } from "lucide-react"

// Tipo estendido para incluir relacionamentos, preço corrigido e o profissional (staff)
type AdminBooking = Booking & {
    service: Omit<BarbershopService, "price"> & { price: number }
    user: User
    staff?: BarberStaff // Adicionado para identificar o barbeiro
}

interface AdminBookingListProps {
    bookings: AdminBooking[]
}

const AdminBookingList = ({ bookings }: AdminBookingListProps) => {
    // FILTRO: Remove cancelados e solicitações da lista de "Próximos Clientes" do dashboard
    const displayBookings = bookings
        .filter(b => b.status === "CONFIRMED" || b.status === "COMPLETED")
        .slice(0, 5)

    if (displayBookings.length === 0) {
        return <div className="text-sm text-muted-foreground py-4 text-center">Nenhum agendamento ativo para exibir.</div>
    }

    return (
        <div className="space-y-4">
            {displayBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-[#141518] border border-[#26272B] rounded-xl transition-all hover:border-primary/20">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-[#26272B]">
                            <AvatarImage src={booking.user.image || ""} />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                {booking.user.name?.[0] || "C"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none text-white">
                                {booking.user.name || "Cliente sem nome"}
                            </p>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{booking.service.name}</span>
                                    {isToday(new Date(booking.date)) && (
                                        <Badge variant="default" className="h-4 px-1 text-[10px] bg-green-500/20 text-green-500 hover:bg-green-500/20 border-none">Hoje</Badge>
                                    )}
                                </div>

                                {/* EXIBIÇÃO DO BARBEIRO */}
                                {booking.staff && (
                                    <div className="flex items-center gap-1 text-[10px] text-primary/80 font-medium">
                                        <Scissors size={10} />
                                        <span>Profissional: {booking.staff.name.split(" ")[0]}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-sm font-bold text-white">
                            {format(new Date(booking.date), "HH:mm")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {format(new Date(booking.date), "dd/MM")}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default AdminBookingList
