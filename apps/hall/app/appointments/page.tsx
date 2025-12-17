import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { redirect } from "next/navigation"
import { db } from "@barbergo/database"
import Header from "../_components/header"
import AppointmentsClient from "@/_components/appointments-client"

export default async function AppointmentsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/")
    }

    // Busca agendamentos reais do usuário
    const bookings = await db.booking.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            service: true,
            barbershop: true,
        },
        orderBy: {
            date: "desc",
        },
    })

    // Serializa os dados (Data obj -> String) se necessário, ou passa direto
    // O componente client receberá os dados

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <div className="container mx-auto p-5 md:py-10">
                <h1 className="text-2xl font-bold mb-6">Agendamentos</h1>
                <AppointmentsClient initialBookings={bookings} />
            </div>
        </div>
    )
}