"use client"
import { Barbershop, BarbershopService } from "@prisma/client"
import Image from "next/image"
import { MapPinIcon } from "lucide-react"
import ServiceItem from "./service-item"
import SidebarRight from "./sidebar-right"
import { useState } from "react"
import { Button, Card, CardContent } from "@barbergo/ui"
import BookingSheet from "./booking-sheet"
import { useSession, signIn } from "next-auth/react"
import Header from "@/_components/header"
import Footer from "@/_components/footer"

// Define o tipo do serviço tratado (price number)
type ServiceWithNumberPrice = Omit<BarbershopService, "price"> & { price: number }

interface BarbershopDetailsProps {
    barbershop: Barbershop & {
        services: ServiceWithNumberPrice[]
    }
}

const BarbershopDetails = ({ barbershop }: BarbershopDetailsProps) => {
    const { data: session } = useSession()
    const [selectedServices, setSelectedServices] = useState<ServiceWithNumberPrice[]>([])
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const handleSelectService = (service: ServiceWithNumberPrice) => {
        // Verifica se já está selecionado
        const isSelected = selectedServices.some(s => s.id === service.id)

        if (isSelected) {
            // Remove
            setSelectedServices(prev => prev.filter(s => s.id !== service.id))
        } else {
            // Adiciona
            setSelectedServices(prev => [...prev, service])
        }
    }

    const handleFinishBooking = () => {
        if (!session?.user) {
            signIn("google")
            return
        }
        setIsSheetOpen(true)
    }

    // Cálculos para o rodapé flutuante
    const totalItems = selectedServices.length
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0)
    const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0)

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative">
            <Header />

            <div className="container mx-auto px-5 md:px-10 py-6 flex-1 pb-32"> {/* pb-32 para dar espaço ao footer flutuante */}
                <div className="flex flex-col lg:flex-row gap-10">

                    <div className="flex-1">
                        <div className="relative h-[250px] md:h-[480px] w-full rounded-2xl overflow-hidden">
                            <Image
                                src={barbershop.imageUrl}
                                fill
                                alt={barbershop.name}
                                className="object-cover"
                            />
                        </div>

                        <div className="mt-6 mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">{barbershop.name}</h1>
                            <div className="flex items-center gap-2 text-gray-400">
                                <MapPinIcon className="text-primary" size={18} />
                                <p className="text-sm">{barbershop.address}</p>
                            </div>
                        </div>

                        <section>
                            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">Serviços</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {barbershop.services.map((service) => (
                                    <ServiceItem
                                        key={service.id}
                                        service={service}
                                        barbershop={barbershop}
                                        isSelected={selectedServices.some(s => s.id === service.id)}
                                        onSelect={() => handleSelectService(service)}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="hidden lg:block w-[380px] relative">
                        <SidebarRight barbershop={barbershop} />
                    </div>
                </div>
            </div>

            {/* RODAPÉ FLUTUANTE DE CARRINHO (Aparece só quando tem itens) */}
            {selectedServices.length > 0 && (
                <div className="fixed bottom-0 left-0 w-full z-50 p-5">
                    <Card className="bg-[#1A1B1F] border border-[#26272B] shadow-2xl rounded-2xl mx-auto max-w-4xl">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-white font-bold text-sm mb-1">{totalItems} serviços selecionados</p>
                                <p className="text-primary font-bold text-md">
                                    {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPrice)}
                                    <span className="text-gray-400 font-normal text-xs ml-2">{totalDuration} min</span>
                                </p>
                            </div>
                            <Button
                                onClick={handleFinishBooking}
                                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-xl"
                            >
                                Agendar
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* COMPONENTE DO SHEET (CONTROLADO PELO PAI) */}
            <BookingSheet
                services={selectedServices}
                barbershop={barbershop}
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />

            <div className="hidden md:block">
                <Footer />
            </div>
        </div>
    )
}

export default BarbershopDetails