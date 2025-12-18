import { db } from "@barbergo/database"
import Header from "../../_components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Button } from "@barbergo/ui"
import { Clock, Scissors, Users, Info, UserCircle } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "../../_lib/auth"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect("/")

    // Buscar usuário e role
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { staffProfile: true }
    })

    // Buscar barbearia
    const barbershop = await db.barbershop.findFirst({
        include: { services: true, staff: true }
    })

    if (!barbershop || !user) return null

    const isAdmin = user.role === "ADMIN"
    const services = barbershop.services.map(s => ({ ...s, price: Number(s.price) }))

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <div className="container mx-auto p-6 max-w-5xl">
                <h2 className="text-3xl font-bold mb-6">{isAdmin ? "Gerenciar Barbearia" : "Minhas Configurações"}</h2>

                <Tabs defaultValue={isAdmin ? "info" : "profile"} className="space-y-6">

                    <TabsList className="bg-[#1A1B1F] p-1 border border-[#26272B] h-auto flex-wrap justify-start">

                        {/* ABAS DO ADMIN */}
                        {isAdmin && (
                            <>
                                <TabsTrigger value="info" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                                    <Info size={16} /> Loja
                                </TabsTrigger>
                                <TabsTrigger value="services" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                                    <Scissors size={16} /> Serviços
                                </TabsTrigger>
                                <TabsTrigger value="staff" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                                    <Users size={16} /> Equipe
                                </TabsTrigger>
                                <TabsTrigger value="hours" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                                    <Clock size={16} /> Horários
                                </TabsTrigger>
                            </>
                        )}

                        {/* ABA DO STAFF (e Admin também pode ver a dele) */}
                        <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                            <UserCircle size={16} /> Meu Perfil
                        </TabsTrigger>
                    </TabsList>

                    {/* CONTEÚDO ADMIN - INFO */}
                    {isAdmin && (
                        <TabsContent value="info">
                            <Card className="bg-[#1A1B1F] border-none">
                                <CardHeader>
                                    <CardTitle>Informações da Loja</CardTitle>
                                    <CardDescription>CNPJ, Endereço e Status.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* ... Campos de CNPJ, Nome, Endereço ... */}
                                    <div className="grid gap-2">
                                        <Label>Nome da Barbearia</Label>
                                        <Input defaultValue={barbershop.name} className="bg-[#141518]" />
                                    </div>
                                    {/* Botão de Fechar Loja */}
                                    <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/10 flex justify-between items-center mt-4">
                                        <span className="text-red-400 font-bold text-sm">Zona de Perigo: Fechamento Manual</span>
                                        <Button variant="destructive" size="sm">Fechar Loja</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* CONTEÚDO ADMIN - EQUIPE */}
                    {isAdmin && (
                        <TabsContent value="staff">
                            <Card className="bg-[#1A1B1F] border-none">
                                <CardHeader className="flex flex-row justify-between">
                                    <CardTitle>Gerenciar Equipe</CardTitle>
                                    <Button size="sm">+ Adicionar Membro</Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {barbershop.staff.map(s => (
                                            <div key={s.id} className="flex justify-between items-center p-3 bg-[#141518] rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-white">
                                                        {s.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-white">{s.name}</p>
                                                        <p className="text-xs text-gray-500">{s.jobTitle}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm">Editar</Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* CONTEÚDO COMUM - PERFIL */}
                    <TabsContent value="profile">
                        <Card className="bg-[#1A1B1F] border-none">
                            <CardHeader>
                                <CardTitle>Meus Dados</CardTitle>
                                <CardDescription>Gerencie sua foto e nome de exibição.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
                                        {user.name?.[0]}
                                    </div>
                                    <Button variant="outline">Alterar Foto</Button>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Seu Nome</Label>
                                    <Input defaultValue={user.name || ""} className="bg-[#141518]" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Email de Login</Label>
                                    <Input defaultValue={user.email} disabled className="bg-[#141518] opacity-50" />
                                </div>
                                <Button className="w-full md:w-auto">Salvar Perfil</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    )
}