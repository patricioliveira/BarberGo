import { db } from "@barbergo/database"
import BarbershopDetails from "./_components/barbershop-details"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/_lib/auth"
import { ViewTracker } from "../../_components/view-tracker"

interface BarbershopDetailsPageProps {
    params: {
        id: string
    }
}

export default async function BarbershopDetailsPage({ params }: BarbershopDetailsPageProps) {
    if (!params.id) return notFound()

    const barbershop = await db.barbershop.findUnique({
        where: {
            id: params.id,
        },
        include: {
            services: {
                include: {
                    staffPrices: true,
                    promotions: {
                        where: { isActive: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            },
            staff: {
                include: {
                    user: true
                }
            },
            ratings: {
                include: {
                    user: true
                }
            },
        },
    })

    if (!barbershop) {
        return notFound()
    }

    const serializedBarbershop = {
        ...barbershop,
        services: barbershop.services.map((service: any) => {
            const promotion = service.promotions[0]
            let finalPrice = Number(service.price)

            // Calculate promotional price if valid
            // Check dates and specific days
            let isPromotionValid = false
            if (promotion) {
                const now = new Date()
                const start = new Date(promotion.startDate)
                // Ajuste para início do dia (00:00:00) para garantir que 'hoje' seja incluído se start == hoje
                start.setHours(0, 0, 0, 0)

                const end = promotion.endDate ? new Date(promotion.endDate) : null
                if (end) end.setHours(23, 59, 59, 999)

                // Ajuste para Timezone do Brasil para verificar o dia da semana correto
                const brazilDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
                const day = brazilDate.getDay() // 0-6

                // Verifica se está dentro do intervalo de datas
                const isDateValid = now >= start && (!end || now <= end)

                if (isDateValid) {
                    if (!promotion.specificDays || promotion.specificDays.length === 0 || promotion.specificDays.includes(day)) {
                        isPromotionValid = true
                    }
                }
            }

            if (isPromotionValid && promotion) {
                if (promotion.promotionalPrice) {
                    finalPrice = Number(promotion.promotionalPrice)
                } else if (promotion.discountPercentage) {
                    finalPrice = Number(service.price) * (1 - (promotion.discountPercentage / 100))
                }
            }

            return {
                ...service,
                price: finalPrice,
                originalPrice: isPromotionValid ? Number(service.price) : undefined,
                staffPrices: service.staffPrices.map((sp: any) => ({
                    staffId: sp.staffId,
                    price: Number(sp.price), // Note: Staff price logic with promotion? Usually base price promtion applies to staff too or not? Start with base service promotion.
                    isLinked: sp.isLinked
                })),
                promotion: isPromotionValid ? promotion : undefined
            }
        }),
    }

    let isFavorited = false
    const session = await getServerSession(authOptions)

    if (session?.user) {
        const favorite = await db.favorite.findUnique({
            where: {
                userId_barbershopId: {
                    userId: (session.user as any).id,
                    barbershopId: params.id,
                },
            },
        })
        if (favorite) isFavorited = true
    }

    //...
    // @ts-ignore - staff agora está incluso no objeto
    return (
        <>
            <ViewTracker barbershopId={barbershop.id} />
            <BarbershopDetails barbershop={serializedBarbershop} initialIsFavorited={isFavorited} />
        </>
    )
}