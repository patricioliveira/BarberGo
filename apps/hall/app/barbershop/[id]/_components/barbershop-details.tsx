"use client"

import { Barbershop, BarbershopService, BarberStaff } from "@prisma/client"
import Image from "next/image"
import { MapPinIcon, PhoneIcon, ClockIcon, CreditCardIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
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

    const openingHours = (barbershop.openingHours as unknown as WorkingHour[]) || []

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(barbershop.address)
        toast.success("Endereço copiado!")
    }

    const handleOpenMap = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`
        window.open(url, "_blank")
    }

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
        const newSelection = isSelected
            ? selectedServices.filter(s => s.id !== service.id)
            : [...selectedServices, service]

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
                            <Image
                                src={barbershop.imageUrl}
                                fill
                                alt={barbershop.name}
                                className="object-cover"
                            />
                        </div>

                        <div className="mt-6 mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">{barbershop.name}</h1>
                            <button
                                onClick={handleCopyAddress}
                                className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-left"
                            >
                                <MapPinIcon className="text-primary shrink-0" size={18} />
                                <p className="text-sm">{barbershop.address}</p>
                            </button>
                        </div>

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

                        <div className="lg:hidden space-y-10 border-t border-secondary pt-10">
                            <section>
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">Sobre nós</h2>
                                <p className="text-gray-400 text-sm leading-relaxed text-justify">
                                    {barbershop.description}
                                </p>
                            </section>

                            <section>
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">Contatos</h2>
                                <div className="space-y-3">
                                    {barbershop.phones.map((phone, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-[#1A1B1F] rounded-xl border border-secondary">
                                            <div className="flex items-center gap-3">
                                                <PhoneIcon size={18} className="text-white" />
                                                <span className="text-sm text-white">{phone}</span>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => window.open(`tel:${phone}`)}>
                                                Ligar
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Horários</h2>
                                    <button
                                        onClick={() => setShowAllHours(!showAllHours)}
                                        className="text-primary text-xs font-bold flex items-center gap-1"
                                    >
                                        {showAllHours ? <><ChevronUpIcon size={14} /> Ver menos</> : <><ChevronDownIcon size={14} /> Ver todos</>}
                                    </button>
                                </div>
                                <div className="bg-[#1A1B1F] rounded-xl border border-secondary p-4 space-y-3">
                                    {openingHours.map((h, i) => (
                                        (showAllHours || i < 1) && (
                                            <div key={h.day} className="flex justify-between items-center text-sm">
                                                <span className="text-gray-400">{h.day}</span>
                                                <span className={h.isOpen ? "text-white" : "text-red-500"}>
                                                    {h.isOpen ? `${h.open} - ${h.close}` : "Fechado"}
                                                </span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">Pagamento</h2>
                                <div className="flex flex-wrap gap-2">
                                    {barbershop.paymentMethods.map((method) => (
                                        <div key={method} className="flex items-center gap-2 px-3 py-2 bg-[#1A1B1F] rounded-full border border-secondary text-xs text-gray-300">
                                            <CreditCardIcon size={14} className="text-primary" />
                                            {method}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">Localização</h2>
                                <div
                                    className="relative h-[180px] w-full rounded-xl overflow-hidden border border-secondary mb-3 cursor-pointer"
                                    onClick={handleOpenMap}
                                >
                                    <Image src="/map.png" fill alt="Mapa" className="object-cover opacity-80" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-primary p-2 rounded-full shadow-lg">
                                            <MapPinIcon size={24} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 text-center">{barbershop.address}</p>
                            </section>
                        </div>
                    </div>

                    <div className="hidden lg:block w-[380px] relative">
                        <SidebarRight barbershop={barbershop} />
                    </div>
                </div>
            </div>

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
                            <Button
                                onClick={handleFinishBooking}
                                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-xl transition-all active:scale-95"
                            >
                                Agendar
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <BookingSheet
                services={selectedServices}
                barbershop={barbershop}
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />

            <Footer />

            <AuthDialog
                isOpen={isAuthOpen}
                onOpenChange={setIsAuthOpen}
                callbackUrl={typeof window !== 'undefined' ? window.location.href : ""}
            />
        </div>
    )
}

export default BarbershopDetails