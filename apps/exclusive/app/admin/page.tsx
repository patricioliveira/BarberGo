import { Card, CardContent, CardHeader, CardTitle } from "@barbergo/ui"
import { db } from "@barbergo/database"
import { CalendarIcon, DollarSignIcon, UsersIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

async function getDashboardData() {
    // Simulação de busca no banco (depois faremos o filtro real por barbearia)
    const totalBookings = await db.booking.count()
    const todayBookings = await db.booking.count({
        where: {
            date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
        }
    })

    // Exemplo: Pegar os próximos 5 agendamentos
    const upcomingBookings = await db.booking.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { user: true, service: true }
    })

    return { totalBookings, todayBookings, upcomingBookings }
}

export default async function AdminDashboard() {
    const data = await getDashboardData()

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Resumo da sua barbearia hoje, {format(new Date(), "d 'de' MMMM", { locale: ptBR })}.
                </p>
            </div>

            {/* Cards de KPIs */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.todayBookings}</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% em relação a ontem
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faturamento Estimado</CardTitle>
                        <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ 0,00</div>
                        <p className="text-xs text-muted-foreground">
                            Baseado nos agendamentos confirmados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12</div>
                        <p className="text-xs text-muted-foreground">
                            Novos clientes este mês
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Lista Recente */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Próximos Clientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {data.upcomingBookings.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhum agendamento futuro encontrado.</p>
                            ) : (
                                data.upcomingBookings.map((booking) => (
                                    <div key={booking.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{booking.user.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {booking.service.name}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">
                                            {format(booking.date, "HH:mm")}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}