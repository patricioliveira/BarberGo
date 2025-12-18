"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@barbergo/ui"
import { Badge } from "@barbergo/ui"
import { Booking, BarbershopService, User } from "@prisma/client"
import { format, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"

// Tipo estendido para incluir relacionamentos e preço corrigido
type AdminBooking = Booking & {
    service: Omit<BarbershopService, "price"> & { price: number }
    user: User
}

interface AdminBookingListProps {
    bookings: AdminBooking[]
}

const AdminBookingList = ({ bookings }: AdminBookingListProps) => {
    if (bookings.length === 0) {
        return <div className="text-sm text-muted-foreground py-4">Nenhum agendamento encontrado.</div>
    }

    return (
        <div className="space-y-4">
            {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-[#141518] border border-[#26272B] rounded-xl">
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
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{booking.service.name}</span>
                                {isToday(new Date(booking.date)) && (
                                    <Badge variant="default" className="h-4 px-1 text-[10px] bg-green-500/20 text-green-500 hover:bg-green-500/20">Hoje</Badge>
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