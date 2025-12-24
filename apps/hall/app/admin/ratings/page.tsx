import { db } from "@barbergo/database"
import { Avatar, AvatarFallback, AvatarImage, Card, Button } from "@barbergo/ui"
import { StarIcon, UserIcon, CalendarDays, ArrowLeft } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Header from "@/_components/header"
import Link from "next/link"
import { RatingVisibilityToggle } from "../_components/rating-visibility-toggle"

export default async function AdminRatingsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) return redirect("/")

    // Busca a barbearia que o usuário administra
    const managedShop = await db.barbershop.findFirst({
        where: { ownerId: (session.user as any).id }
    })

    if (!managedShop) return <div className="p-5 text-white">Você não possui uma barbearia cadastrada.</div>

    const ratings = await db.rating.findMany({
        where: { barbershopId: managedShop.id },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <div className="p-5 space-y-6 text-white max-w-4xl mx-auto pb-24">

                {/* Header da Página com Botão Voltar */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="border-secondary h-10 w-10 shrink-0" asChild>
                        <Link href="/admin">
                            <ArrowLeft size={20} />
                        </Link>
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold">Gestão de Avaliações</h1>
                        <p className="text-sm text-gray-400">Gerencie o que seus clientes estão falando sobre sua barbearia.</p>
                    </div>
                </div>

                <div className="grid gap-4 mt-6">
                    {ratings.map((rating) => (
                        <Card key={rating.id} className="bg-[#1A1B1F] border-secondary p-5 transition-all hover:border-primary/50">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex gap-4 w-full">
                                    <Avatar className="h-12 w-12 border border-secondary">
                                        <AvatarImage src={rating.user.image || ""} />
                                        <AvatarFallback className="bg-secondary text-gray-400"><UserIcon /></AvatarFallback>
                                    </Avatar>

                                    <div className="space-y-1 w-full">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
                                            <p className="font-bold text-base">{rating.user.name}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <CalendarDays size={12} />
                                                {format(rating.createdAt, "d 'de' MMMM, yyyy", { locale: ptBR })}
                                            </p>
                                        </div>

                                        <div className="flex gap-1 my-1">
                                            {[...Array(5)].map((_, i) => (
                                                <StarIcon
                                                    key={i}
                                                    size={14}
                                                    className={i < rating.stars ? "fill-primary text-primary" : "text-gray-600"}
                                                />
                                            ))}
                                        </div>

                                        <div className="bg-black/20 p-3 rounded-lg border border-white/5 mt-2">
                                            <p className="text-sm text-gray-300 italic">
                                                "{rating.comment || "Cliente não deixou comentário."}"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end gap-3 min-w-[120px] pl-4 border-l border-secondary sm:border-none">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Visibilidade</span>
                                    <RatingVisibilityToggle ratingId={rating.id} initialValue={rating.showOnPage} />
                                </div>
                            </div>
                        </Card>
                    ))}
                    {ratings.length === 0 && (
                        <div className="text-center py-10 text-gray-500 bg-[#1A1B1F] rounded-xl border border-secondary border-dashed">
                            <p>Nenhuma avaliação recebida ainda.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}