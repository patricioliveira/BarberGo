"use client"

import { Barbershop, BarbershopService, BarberStaff, Rating } from "@prisma/client"
import Image from "next/image"
import { BarbershopImage } from "../../_components/barbershop-image"
import {
    MapPinIcon, PhoneIcon, CreditCardIcon, ChevronDownIcon, ChevronUpIcon,
    StarIcon, Wifi, Car, Baby, Accessibility, Instagram, MessageCircle, Heart,
    Snowflake, Tv, Coffee, Beer, Gamepad2, PawPrint, Martini
} from "lucide-react"

import { useState, useEffect } from "react"
import { Button, Card, CardContent } from "@barbergo/ui"

import { useSession } from "next-auth/react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import BookingSheet from "./booking-sheet"
import Footer from "@/_components/footer"
import AuthDialog from "@/_components/auth-dialog"
import SidebarRight from "./sidebar-right"
import ServiceItem from "./service-item"
import Header from "@/_components/header"
import { toggleFavorite } from "@/_actions/toggle-favorite"


type ServiceWithNumberPrice = Omit<BarbershopService, "price"> & {
    price: number
    staffPrices?: { staffId: string; price: number; isLinked: boolean }[]
}
type PhoneObj = { number: string; isWhatsapp: boolean }

interface BarbershopDetailsProps {
    barbershop: Barbershop & {
        services: ServiceWithNumberPrice[]
        staff: BarberStaff[]
        // O user ainda vem na query, mas não vamos exibir
        ratings: (Rating & { user: { name: string | null, image: string | null } | null })[]
    }
    initialIsFavorited: boolean
}

interface WorkingHour {
    day: string
    open: string
    close: string
    isOpen: boolean
}

const amenityIcons: any = {
    "WIFI": { icon: Wifi, label: "Wi-Fi" },
    "ACCESSIBILITY": { icon: Accessibility, label: "Acessibilidade" },
    "PARKING": { icon: Car, label: "Estacionamento" },
    "TV": { icon: Tv, label: "TV" },
    "COFFEE": { icon: Coffee, label: "Café" },
    "BEER": { icon: Beer, label: "Cerveja" },
    "BAR": { icon: Martini, label: "Bar" },
    "VIDEO_GAME": { icon: Gamepad2, label: "Video Game" },
    "KIDS": { icon: Baby, label: "Kids" },
    "PET_FRIENDLY": { icon: PawPrint, label: "Pet Friendly" },
    "AIR_CONDITIONING": { icon: Snowflake, label: "Ar Condicionado" },
}

const BarbershopDetails = (props: BarbershopDetailsProps) => {
    const { barbershop } = props
    const { data: session } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [selectedServices, setSelectedServices] = useState<ServiceWithNumberPrice[]>([])
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isAuthOpen, setIsAuthOpen] = useState(false)
    const [showAllHours, setShowAllHours] = useState(false)
    const [isFavorited, setIsFavorited] = useState(props.initialIsFavorited)

    // Cálculo da Média
    const totalRatings = props.barbershop.ratings.length
    const averageRating = totalRatings > 0 ? props.barbershop.ratings.reduce((acc, r) => acc + r.stars, 0) / totalRatings : 5.0

    // Filtra apenas avaliações marcadas para exibir
    const visibleRatings = props.barbershop.ratings.filter(r => r.showOnPage)

    const openingHours = (props.barbershop.openingHours as unknown as WorkingHour[]) || []

    // Tratamento Telefones
    let phones: PhoneObj[] = []
    if (Array.isArray(props.barbershop.phones)) {
        if (props.barbershop.phones.length > 0 && typeof props.barbershop.phones[0] === 'string') {
            phones = (props.barbershop.phones as string[]).map(p => ({ number: p, isWhatsapp: false }))
        } else {
            phones = props.barbershop.phones as PhoneObj[]
        }
    }

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(props.barbershop.address)
        toast.success("Endereço copiado!")
    }

    const handleOpenMap = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.barbershop.address)}`
        window.open(url, "_blank")
    }

    const handleToggleFavorite = async () => {
        if (!session?.user) {
            setIsAuthOpen(true)
            return
        }

        try {
            setIsFavorited((prev) => !prev)
            await toggleFavorite({
                barbershopId: props.barbershop.id,
                userId: (session.user as any).id,
            })
            toast.success(isFavorited ? "Removido dos favoritos." : "Adicionado aos favoritos!")
        } catch (error) {
            setIsFavorited((prev) => !prev) // Revert optimistic
            toast.error("Erro ao favoritar.")
        }
    }

    useEffect(() => {
        const servicesIds = searchParams.get("services")?.split(",")
        const shouldOpenBooking = searchParams.get("book") === "true"
        if (servicesIds) {
            const restored = props.barbershop.services.filter(s => servicesIds.includes(s.id))
            setSelectedServices(restored)
            if (shouldOpenBooking && session?.user && restored.length > 0) {
                setIsSheetOpen(true)
                const params = new URLSearchParams(searchParams.toString())
                params.delete("book")
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
            }
        }
    }, [searchParams, props.barbershop.services, session, pathname, router])

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

        // --- VALIDATION RULES FOR EXCLUSIVE SERVICES ---
        const linkedServices = selectedServices.filter(s => s.staffPrices?.some(sp => sp.isLinked))
        const unlinkedServices = selectedServices.filter(s => !s.staffPrices?.some(sp => sp.isLinked))

        // Rule 1: Cannot mix Linked and Unlinked
        if (linkedServices.length > 0 && unlinkedServices.length > 0) {
            toast.error("Não é possível misturar serviços exclusivos com serviços comuns. Por favor, faça agendamentos separados.", {
                duration: 5000,
                action: {
                    label: "Entendi",
                    onClick: () => { }
                }
            })
            return
        }

        // Rule 2: Cannot mix Linked services from different barbers
        if (linkedServices.length > 1) {
            const staffIds = new Set(linkedServices.map(s => s.staffPrices?.find(sp => sp.isLinked)?.staffId))
            if (staffIds.size > 1) {
                toast.error("Não é possível agendar com barbeiros diferentes no mesmo horário. Faça agendamentos separados.", {
                    duration: 5000
                })
                return
            }
        }

        setIsSheetOpen(true)
    }

    const totalItems = selectedServices.length
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0)
    const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0)

    return (
        <div className="min-h-screen bg-[#121214] text-white selection:bg-primary/30 pb-10">

            {/* HERO SECTION IMMERSIVE */}
            <div className="relative w-full h-[60vh] min-h-[500px] lg:h-[70vh]">
                <BarbershopImage
                    src={props.barbershop.imageUrl}
                    fill
                    alt={props.barbershop.name}
                    className="object-cover opacity-80"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#121214]/80 to-transparent" />

                {/* Header Flutuante Transparente */}
                <div className="absolute top-0 left-0 w-full z-50 p-6">
                    <Header />
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-20 z-20">
                    <div className="container mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            <div className="space-y-4 max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
                                <div className="flex items-center gap-2 text-primary/90 font-medium tracking-wider text-xs uppercase bg-primary/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-primary/20">
                                    <StarIcon size={12} className="fill-current" />
                                    Premium Barbershop
                                </div>
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-none shadow-black drop-shadow-lg">
                                    {props.barbershop.name}
                                </h1>
                                <button onClick={handleCopyAddress} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-left group">
                                    <div className="bg-white/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors backdrop-blur-md">
                                        <MapPinIcon className="text-primary" size={20} />
                                    </div>
                                    <p className="text-sm md:text-lg font-light">{props.barbershop.address}</p>
                                </button>
                            </div>

                            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
                                    <div className="flex flex-col">
                                        <span className="text-3xl font-bold text-white leading-none">{averageRating.toFixed(1)}</span>
                                        <div className="flex gap-0.5 mt-1">
                                            {[...Array(5)].map((_, i) => (
                                                <StarIcon key={i} size={12} className={i < Math.round(averageRating) ? "fill-primary text-primary" : "text-gray-600"} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-10 w-px bg-white/10" />
                                    <span className="text-xs text-gray-300 font-medium w-16 leading-tight">{totalRatings} opniões verificadas</span>
                                </div>

                                <button
                                    onClick={handleToggleFavorite}
                                    className={`flex items-center justify-center gap-2 w-full p-3 rounded-xl border transition-all font-medium backdrop-blur-md ${isFavorited
                                        ? "bg-red-500/20 border-red-500/50 text-red-500 hover:bg-red-500/30"
                                        : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-primary/50"}`}
                                >
                                    <Heart size={18} className={isFavorited ? "fill-current" : ""} />
                                    {isFavorited ? "Favorito" : "Favoritar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 mt-12 relative z-10">
                <div className="grid lg:grid-cols-[1fr,380px] gap-12 lg:gap-16">
                    {/* LEFTSIDE */}
                    <div className="flex-1 space-y-16">

                        {/* COMODIDADES */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></span>
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">Experiência</h2>
                                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></span>
                            </div>
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-4">
                                {barbershop.amenities.map(a => {
                                    const Item = amenityIcons[a]
                                    if (!Item) return null
                                    return (
                                        <div key={a} className="flex flex-col items-center justify-center gap-2 bg-[#1A1B1F] p-4 rounded-2xl border border-white/5 hover:border-primary/30 hover:bg-[#202125] transition-all group">
                                            <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                                                <Item.icon size={20} className="text-gray-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-xs text-gray-300 font-medium">{Item.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* SERVIÇOS */}
                        <section id="services">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white relative pl-4 border-l-4 border-primary">
                                    Nossos Serviços
                                </h2>
                            </div>
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

                        {/* AVALIAÇÕES */}
                        {visibleRatings.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></span>
                                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">O que dizem os clientes</h2>
                                    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></span>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {visibleRatings.map((rating) => (
                                        <div key={rating.id} className="bg-[#1A1B1F] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <StarIcon key={i} size={14} className={i < rating.stars ? "fill-primary text-primary" : "text-gray-700"} />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {format(new Date(rating.createdAt), "d MMM", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-300 leading-relaxed italic">"{rating.comment || "Sem comentário"}"</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* MOBILE INFO */}
                        <div className="lg:hidden space-y-12 pt-8 border-t border-white/5">
                            <section>
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><MapPinIcon size={18} className="text-primary" /> Localização</h2>
                                <div className="relative h-[200px] w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-4" onClick={handleOpenMap}>
                                    <Image src="/map.png" fill alt="Mapa" className="object-cover opacity-60 hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-primary p-3 rounded-full shadow-xl animate-bounce">
                                            <MapPinIcon size={24} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-400 text-sm text-center">{barbershop.address}</p>
                            </section>

                            <section>
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><ChevronDownIcon size={18} className="text-primary" /> Horários</h2>
                                <div className="grid grid-cols-1 gap-2">
                                    {openingHours.map((h, i) => (
                                        <div key={h.day} className={`flex justify-between items-center p-3 rounded-lg border ${h.isOpen ? "bg-[#1A1B1F] border-white/5" : "bg-white/5 border-transparent opacity-50"}`}>
                                            <span className="text-sm text-gray-300 font-medium">{h.day}</span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded bg-black/20 ${h.isOpen ? "text-green-400" : "text-red-400"}`}>
                                                {h.isOpen ? `${h.open} - ${h.close}` : "Fechado"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                    </div>

                    {/* RIGHT SIDEBAR (Desktop) */}
                    <div className="hidden lg:block relative">
                        <div className="sticky top-6">
                            <SidebarRight barbershop={barbershop} />
                        </div>
                    </div>
                </div>
            </div>

            {/* FLOATING BOOKING BAR */}
            {selectedServices.length > 0 && (
                <div className="fixed bottom-6 left-0 w-full z-50 px-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="container mx-auto">
                        <Card className="bg-[#1A1B1F]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl max-w-4xl mx-auto overflow-hidden ring-1 ring-white/5">
                            <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <p className="text-gray-400 font-medium text-xs mb-0.5 uppercase tracking-wide">{totalItems} {totalItems === 1 ? 'item selecionado' : 'itens selecionados'}</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-white font-bold text-xl sm:text-2xl">
                                            {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPrice)}
                                        </p>
                                        <span className="text-primary font-medium text-sm">~{totalDuration} min</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleFinishBooking}
                                    className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-xl transition-all shadow-lg shadow-primary/25 hover:scale-105 active:scale-95"
                                >
                                    Concluir Agendamento
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            <BookingSheet services={selectedServices} barbershop={barbershop} isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
            <div className="mt-20 border-t border-white/5 pt-10">
                <Footer />
            </div>
            <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} callbackUrl={typeof window !== 'undefined' ? window.location.href : ""} />
        </div>
    )
}

export default BarbershopDetails