import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { redirect } from "next/navigation"
import { db } from "@barbergo/database"
import Header from "../_components/header"
import Footer from "../_components/footer"
import AppointmentsClient from "@/_components/appointments-client"

export default async function AppointmentsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/")
    }

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

    // CORREÇÃO: Converter Decimal para Number
    const serializedBookings = bookings.map((booking) => ({
        ...booking,
        service: {
            ...booking.service,
            price: Number(booking.service.price),
        },
    }))

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />
            <div className="container mx-auto p-5 md:py-10 flex-1">
                <h1 className="text-2xl font-bold mb-6">Agendamentos</h1>
                {/* Passamos os dados serializados */}
                <AppointmentsClient initialBookings={serializedBookings} />
            </div>
            <Footer />
        </div>
    )
}