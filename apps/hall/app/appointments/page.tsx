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
        where: { userId: session.user.id },
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

    // Serializa os dados (converte Decimal para number/string se necessário, embora o componente aceite number)
    // O Next.js reclama de objetos complexos passados para Client Components, 
    // mas se seus tipos estiverem alinhados, passará direto.
    // Caso tenha erro de serialização de Decimal, precisará de um map.
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
                    <p className="text-gray-400">Gerencie suas reservas e histórico de serviços.</p>
                </header>

                <AppointmentsClient initialBookings={serializedBookings} />
            </div>
            <Footer />
        </div>
    )
}