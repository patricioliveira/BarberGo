"use client"

import { Barbershop, BarbershopService, BarberStaff, Rating } from "@prisma/client"
import Image from "next/image"
import {
    MapPinIcon, PhoneIcon, CreditCardIcon, ChevronDownIcon, ChevronUpIcon,
    StarIcon, Wifi, Car, Baby, Accessibility, Instagram, MessageCircle, Heart
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


type ServiceWithNumberPrice = Omit<BarbershopService, "price"> & { price: number }
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
    "PARKING": { icon: Car, label: "Estacionamento" },
    "KIDS": { icon: Baby, label: "Kids" },
    "ACCESSIBILITY": { icon: Accessibility, label: "Acessibilidade" },
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
                            <Image src={props.barbershop.imageUrl} fill alt={props.barbershop.name} className="object-cover" />
                        </div>

                        <div className="mt-6 mb-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2">{props.barbershop.name}</h1>
                                    <button onClick={handleCopyAddress} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-left">
                                        <MapPinIcon className="text-primary shrink-0" size={18} />
                                        <p className="text-sm">{props.barbershop.address}</p>
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    <div className="flex flex-col items-end bg-[#1A1B1F] p-2 rounded-lg border border-secondary">
                                        <div className="flex items-center gap-1 text-primary">
                                            <StarIcon size={18} className="fill-primary" />
                                            <span className="text-lg font-bold">{averageRating.toFixed(1)}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500">{totalRatings} avaliações</span>
                                    </div>
                                    <button
                                        onClick={handleToggleFavorite}
                                        className={`flex items-center justify-center p-2 rounded-lg border transition-all ${isFavorited ? "bg-red-500/10 border-red-500 text-red-500" : "bg-[#1A1B1F] border-secondary text-gray-400 hover:bg-[#26272B]"}`}
                                        title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                    >
                                        <Heart size={20} className={isFavorited ? "fill-current" : ""} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Comodidades (Mobile) */}
                        {barbershop.amenities && barbershop.amenities.length > 0 && (
                            <div className="mb-8 lg:hidden">
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">Comodidades</h2>
                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                    {barbershop.amenities.map(a => {
                                        const Item = amenityIcons[a]
                                        if (!Item) return null
                                        return (
                                            <div key={a} className="flex flex-col items-center gap-2 min-w-[70px] bg-[#1A1B1F] p-3 rounded-xl border border-secondary">
                                                <Item.icon size={20} className="text-primary" />
                                                <span className="text-[10px] text-gray-300 font-bold">{Item.label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* SEÇÃO DE AVALIAÇÕES (MODIFICADA: Sem Avatar/Nome) */}
                        {visibleRatings.length > 0 && (
                            <section className="mb-10">
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">O que dizem os clientes</h2>
                                <div className="space-y-3">
                                    {visibleRatings.map((rating) => (
                                        <div key={rating.id} className="bg-[#1A1B1F] p-4 rounded-xl border border-secondary">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <StarIcon
                                                            key={i}
                                                            size={14}
                                                            className={i < rating.stars ? "fill-primary text-primary" : "text-gray-700"}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-gray-500">
                                                    {format(new Date(rating.createdAt), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                                </p>
                                            </div>
                                            {rating.comment ? (
                                                <p className="text-sm text-gray-300 leading-relaxed italic">"{rating.comment}"</p>
                                            ) : (
                                                <p className="text-xs text-gray-500 italic">Avaliação sem comentário.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

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

                        {/* Informações Mobile */}
                        <div className="lg:hidden space-y-10 border-t border-secondary pt-10">
                            {barbershop.instagram && (
                                <section>
                                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">Redes Sociais</h2>
                                    <Button variant="outline" className="w-full border-pink-500/30 text-pink-500 hover:bg-pink-500/10 h-12" onClick={() => window.open(`https://instagram.com/${barbershop.instagram?.replace('@', '')}`, '_blank')}>
                                        <Instagram size={20} className="mr-2" /> {barbershop.instagram}
                                    </Button>
                                </section>
                            )}

                            <section>
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">Sobre nós</h2>
                                <p className="text-gray-400 text-sm leading-relaxed text-justify">
                                    {barbershop.description}
                                </p>
                            </section>

                            <section>
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">Contatos</h2>
                                <div className="space-y-3">
                                    {phones.map((phone, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-[#1A1B1F] rounded-xl border border-secondary">
                                            <div className="flex items-center gap-3">
                                                <PhoneIcon size={18} className="text-white" />
                                                <span className="text-sm text-white">{phone.number}</span>
                                            </div>
                                            {phone.isWhatsapp ? (
                                                <Button variant="secondary" size="sm" className="h-8 rounded-lg text-xs bg-green-600/20 text-green-500" onClick={() => window.open(`https://wa.me/55${phone.number.replace(/\D/g, "")}`, '_blank')}>
                                                    <MessageCircle size={16} className="mr-1" /> Whats
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => { navigator.clipboard.writeText(phone.number); toast.success("Copiado!") }}>
                                                    Copiar
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Horários</h2>
                                    <button onClick={() => setShowAllHours(!showAllHours)} className="text-primary text-xs font-bold flex items-center gap-1">
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
                                <div className="relative h-[180px] w-full rounded-xl overflow-hidden border border-secondary mb-3 cursor-pointer" onClick={handleOpenMap}>
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