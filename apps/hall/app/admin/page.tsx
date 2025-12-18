import { Card, CardContent, CardHeader, CardTitle } from "@barbergo/ui"
import { db } from "@barbergo/database"
import { CalendarIcon, DollarSignIcon, StoreIcon } from "lucide-react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/_lib/auth"

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect("/login")

    // Busca as barbearias que esse usuário gerencia
    const myBarbershops = await db.barbershop.findMany({
        where: {
            ownerId: session.user.id
        },
        include: {
            bookings: true // Inclui agendamentos para contagem
        }
    })

    const bookings = await db.booking.findMany({
        include: {
            service: true,
            user: true, // Inclui dados do cliente
        },
        orderBy: {
            date: "desc",
        },
    })

    // CORREÇÃO: Serializar para evitar erro do Decimal
    const serializedBookings = bookings.map((booking) => ({
        ...booking,
        service: {
            ...booking.service,
            price: Number(booking.service.price),
        },
    }))

    // Calcula totais somando todas as barbearias dele
    const totalBookings = myBarbershops.reduce((acc, shop) => acc + shop.bookings.length, 0)
    const totalShops = myBarbershops.length

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Painel do Parceiro</h2>
                <p className="text-muted-foreground">
                    Gerencie suas {totalShops} barbearias cadastradas no Hall.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Minhas Barbearias</CardTitle>
                        <StoreIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalShops}</div>
                        <p className="text-xs text-muted-foreground">
                            Ativas na plataforma
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBookings}</div>
                    </CardContent>
                </Card>

                {/* Mais cards aqui... */}
            </div>

            {/* Lista das Barbearias */}
            <div className="grid gap-4">
                <h3 className="text-xl font-semibold">Suas Unidades</h3>
                {myBarbershops.map((shop) => (
                    <Card key={shop.id}>
                        <CardHeader>
                            <CardTitle>{shop.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{shop.address}</p>
                            {/* Futuramente: Botão para "Gerenciar esta unidade" */}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}