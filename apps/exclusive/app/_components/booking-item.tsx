"use client"

import { Avatar, AvatarImage, Badge, Button, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Textarea } from "@barbergo/ui"
import { Prisma } from "@prisma/client"
import { format, isFuture, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"
import { StarIcon, Loader2 } from "lucide-react"
import { SetStateAction, useState } from "react"
import { toast } from "sonner"
import { saveRating } from "@/_actions/ratings"

// Ajuste na tipagem para incluir 'rating' (opcional) no payload
interface BookingItemProps {
    booking: Prisma.BookingGetPayload<{
        include: {
            service: {
                include: {
                    barbershop: true
                }
            },
            rating: true // ADICIONADO AQUI
        }
    }>
}

const BookingItem = ({ booking }: BookingItemProps) => {
    const isBookingFuture = isFuture(new Date(booking.date))
    const [selectedStars, setSelectedStars] = useState(0)
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleRatingSubmit = async () => {
        if (selectedStars === 0) return toast.error("Selecione pelo menos 1 estrela.")

        try {
            setIsSubmitting(true)
            await saveRating({
                bookingId: booking.id,
                barbershopId: booking.barbershopId,
                stars: selectedStars,
                comment
            })
            toast.success("Avaliação enviada com sucesso!")
            setIsDialogOpen(false)
        } catch (error) {
            toast.error("Erro ao enviar avaliação.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="min-w-[90%]">
            <CardContent className="flex justify-between p-0">
                {/* Esquerda */}
                <div className="flex flex-col gap-2 py-5 pl-5">
                    <Badge
                        className="w-fit"
                        variant={isBookingFuture ? "default" : "secondary"}
                    >
                        {isBookingFuture ? "Confirmado" : "Finalizado"}
                    </Badge>
                    <h3 className="font-semibold">{booking.service.name}</h3>

                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={booking.service.barbershop.imageUrl} />
                        </Avatar>
                        <p className="text-sm">{booking.service.barbershop.name}</p>
                    </div>
                </div>

                {/* Direita */}
                <div className="flex flex-col items-center justify-center border-l-2 border-solid px-5">
                    <p className="text-sm capitalize">
                        {format(new Date(booking.date), "MMMM", { locale: ptBR })}
                    </p>
                    <p className="text-2xl">
                        {format(new Date(booking.date), "dd", { locale: ptBR })}
                    </p>
                    <p className="text-sm">
                        {format(new Date(booking.date), "HH:mm", { locale: ptBR })}
                    </p>
                </div>
            </CardContent>

            {/* Botão de Avaliar fora do CardContent para ficar full width se desejar, ou dentro dependendo do layout */}
            {booking.status === "CONFIRMED" && isPast(new Date(booking.date)) && !booking.rating && (
                <div className="px-5 pb-5">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">Avaliar Serviço</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1A1B1F] border-secondary text-white w-[90%] rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>Avalie sua experiência</DialogTitle>
                                <DialogDescription>Sua opinião ajuda a barbearia a melhorar.</DialogDescription>
                            </DialogHeader>

                            <div className="flex justify-center gap-2 py-4">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <StarIcon
                                        key={s}
                                        size={32}
                                        className={`cursor-pointer transition-colors ${s <= selectedStars ? "fill-primary text-primary" : "text-gray-600"}`}
                                        onClick={() => setSelectedStars(s)}
                                    />
                                ))}
                            </div>

                            <Textarea
                                placeholder="Deixe um comentário (opcional)"
                                className="bg-secondary border-none resize-none"
                                value={comment}
                                onChange={(e: { target: { value: SetStateAction<string> } }) => setComment(e.target.value)}
                            />

                            <DialogFooter>
                                <Button onClick={handleRatingSubmit} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enviar Avaliação
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </Card>
    )
}

export default BookingItem