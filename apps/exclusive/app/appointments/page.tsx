import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { redirect } from "next/navigation"
import { db } from "@barbergo/database"
import Header from "../_components/header"
import Footer from "../_components/footer"
import AppointmentsClient from "../_components/appointments-client"

export default async function AppointmentsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/")
    }

    const bookings = await db.booking.findMany({
        where: { userId: (session.user as any).id },
        include: {
            service: true,
            barbershop: true,
            staff: {
                include: { user: true }
            },
            rating: true,
        },
        orderBy: { date: "desc" },
    })

    const serializedBookings = bookings.map(booking => ({
        ...booking,
        service: {
            ...booking.service,
            price: Number(booking.service.price)
        }
    }))

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />
            <div className="container mx-auto p-4 md:p-8 flex-1">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Meus Agendamentos</h1>
                    <p className="text-gray-400">Gerencie seus agendamentos e histórico de serviços.</p>
                </header>

                <AppointmentsClient initialBookings={serializedBookings} />
            </div>
            <Footer />
        </div>
    )
}
