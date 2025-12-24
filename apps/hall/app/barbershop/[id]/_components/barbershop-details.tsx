"use client"

import { Barbershop, BarbershopService, BarberStaff, Rating } from "@prisma/client"
import Image from "next/image"
import { MapPinIcon, PhoneIcon, CreditCardIcon, ChevronDownIcon, ChevronUpIcon, StarIcon } from "lucide-react"
import ServiceItem from "./service-item"
import SidebarRight from "./sidebar-right"
import { useState, useEffect } from "react"
import { Button, Card, CardContent } from "@barbergo/ui"
import BookingSheet from "./booking-sheet"
import { useSession } from "next-auth/react"
import Header from "@/_components/header"
import Footer from "@/_components/footer"
import AuthDialog from "@/_components/auth-dialog"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

type ServiceWithNumberPrice = Omit<BarbershopService, "price"> & { price: number }

interface BarbershopDetailsProps {
    barbershop: Barbershop & {
        services: ServiceWithNumberPrice[]
        staff: BarberStaff[]
        ratings: Rating[] // Recebe ratings via prop
    }
}

interface WorkingHour {
    day: string
    open: string
    close: string
    isOpen: boolean
}

const BarbershopDetails = ({ barbershop }: BarbershopDetailsProps) => {
    const { data: session } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [selectedServices, setSelectedServices] = useState<ServiceWithNumberPrice[]>([])
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isAuthOpen, setIsAuthOpen] = useState(false)
    const [showAllHours, setShowAllHours] = useState(false)

    // Cálculo da média feito no cliente com os dados recebidos
    const totalRatings = barbershop.ratings.length
    const averageRating = totalRatings > 0
        ? barbershop.ratings.reduce((acc, r) => acc + r.stars, 0) / totalRatings
        : 5.0

    const openingHours = (barbershop.openingHours as unknown as WorkingHour[]) || []

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(barbershop.address)
        toast.success("Endereço copiado!")
    }

    const handleOpenMap = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`
        window.open(url, "_blank")
    }

    // ... (Mantenha os useEffects e handlers de seleção de serviço iguais ao seu código original) ...
    // Vou resumir para focar na correção, mas você deve manter todo o código de lógica de URL/Sheet aqui.
    useEffect(() => {
        const servicesIds = searchParams.get("services")?.split(",")
        const shouldOpenBooking = searchParams.get("book") === "true"
        if (servicesIds) {
            const restored = barbershop.services.filter(s => servicesIds.includes(s.id))
            setSelectedServices(restored)
            if (shouldOpenBooking && session?.user && restored.length > 0) {
                setIsSheetOpen(true)
                const params = new URLSearchParams(searchParams.toString())
                params.delete("book")
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
            }
        }
    }, [searchParams, barbershop.services, session, pathname, router])

    const updateUrl = (services: ServiceWithNumberPrice[], includeBookParam = false) => {
        const params = new URLSearchParams(searchParams.toString())
        const ids = services.map(s => s.id).join(",")
        if (ids) params.set("services", ids)
        else params.delete("services")
        if (includeBookParam) params.set("book", "true")
        else params.delete("book")
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const handleSelectService = (service: ServiceWithNumberPrice) => {
        const isSelected = selectedServices.some(s => s.id === service.id)
        const newSelection = isSelected ? selectedServices.filter(s => s.id !== service.id) : [...selectedServices, service]
        setSelectedServices(newSelection)
        updateUrl(newSelection)
    }

    const handleFinishBooking = () => {
        if (!session?.user) {
            updateUrl(selectedServices, true)
            setIsAuthOpen(true)
            return
        }
        setIsSheetOpen(true)
    }

    const totalItems = selectedServices.length
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0)
    const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0)

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative">
            <Header />
            <div className="container mx-auto px-5 md:px-10 py-6 flex-1 pb-32">
                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1">
                        <div className="relative h-[250px] md:h-[480px] w-full rounded-2xl overflow-hidden shadow-lg">
                            <Image src={barbershop.imageUrl} fill alt={barbershop.name} className="object-cover" />
                        </div>

                        <div className="mt-6 mb-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2">{barbershop.name}</h1>
                                    <button onClick={handleCopyAddress} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-left">
                                        <MapPinIcon className="text-primary shrink-0" size={18} />
                                        <p className="text-sm">{barbershop.address}</p>
                                    </button>
                                </div>
                                {/* Exibição da Nota */}
                                <div className="flex flex-col items-end bg-[#1A1B1F] p-2 rounded-lg border border-secondary">
                                    <div className="flex items-center gap-1 text-primary">
                                        <StarIcon size={18} className="fill-primary" />
                                        <span className="text-lg font-bold">{averageRating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500">{totalRatings} avaliações</span>
                                </div>
                            </div>
                        </div>

                        {/* ... (Restante das seções: Serviços, Sobre, Contatos, Horários, Mapa igual ao original) ... */}

                        {/* Seção de Avaliações Visíveis */}
                        {barbershop.ratings.length > 0 && (
                            <section className="mb-10 border-t border-secondary pt-6">
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">O que dizem os clientes</h2>
                                <div className="space-y-3">
                                    {barbershop.ratings.filter(r => r.showOnPage).map((rating) => (
                                        <div key={rating.id} className="bg-[#1A1B1F] p-4 rounded-xl border border-secondary">
                                            <div className="flex gap-1 mb-2">
                                                {[...Array(rating.stars)].map((_, i) => <StarIcon size={12} className="fill-primary text-primary" key={i} />)}
                                            </div>
                                            <p className="text-sm text-gray-300">"{rating.comment}"</p>
                                        </div>
                                    ))}
                                    {barbershop.ratings.filter(r => r.showOnPage).length === 0 && (
                                        <p className="text-sm text-gray-500 italic">Nenhum comentário destacado ainda.</p>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Mantenha o restante do JSX (Services, Sobre, etc) igual ao original para não quebrar o layout */}
                        <section className="mb-10">
                            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">Serviços</h2>
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
                        {/* ... Restante das seções mobile (Sobre, Contatos, Horarios, Mapa) ... */}
                    </div>
                    <div className="hidden lg:block w-[380px] relative">
                        <SidebarRight barbershop={barbershop} />
                    </div>
                </div>
            </div>

            {/* Barra fixa inferior de agendamento */}
            {selectedServices.length > 0 && (
                <div className="fixed bottom-0 left-0 w-full z-50 p-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Card className="bg-[#1A1B1F]/95 backdrop-blur-md border border-[#26272B] shadow-2xl rounded-2xl mx-auto max-w-4xl">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-white font-bold text-sm mb-1">{totalItems} {totalItems === 1 ? 'serviço selecionado' : 'serviços selecionados'}</p>
                                <p className="text-primary font-bold text-md">
                                    {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPrice)}
                                    <span className="text-gray-400 font-normal text-xs ml-2">({totalDuration} min)</span>
                                </p>
                            </div>
                            <Button onClick={handleFinishBooking} className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-xl transition-all active:scale-95">Agendar</Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <BookingSheet services={selectedServices} barbershop={barbershop} isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
            <Footer />
            <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} callbackUrl={typeof window !== 'undefined' ? window.location.href : ""} />
        </div>
    )
}

export default BarbershopDetails