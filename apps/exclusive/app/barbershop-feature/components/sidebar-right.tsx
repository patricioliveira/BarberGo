"use client"

import { Barbershop, Rating } from "@prisma/client"
import { Card, CardContent, Button } from "@barbergo/ui"
import Image from "next/image"
import { MapPinIcon, PhoneIcon, CreditCardIcon, StarIcon, Wifi, Car, Baby, Accessibility, Instagram, MessageCircle, Snowflake, Tv, Coffee, Beer, Gamepad2, PawPrint, Martini } from "lucide-react"
import { toast } from "sonner"

// Tipagem para os telefones salvos como JSON
type PhoneObj = { number: string; isWhatsapp: boolean }

interface SidebarRightProps {
    barbershop: Barbershop & {
        ratings?: Rating[]
    }
}

interface WorkingHour {
    day: string
    open: string
    close: string
    isOpen: boolean
}

// Mapeamento de ícones
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

const SidebarRight = ({ barbershop }: SidebarRightProps) => {
    const handleCopyAddress = () => {
        navigator.clipboard.writeText(barbershop.address)
        toast.success("Endereço copiado!")
    }

    const handleOpenMap = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`
        window.open(url, "_blank")
    }

    const openingHours = (barbershop.openingHours as unknown as WorkingHour[]) || []

    // Tratamento dos telefones
    let phones: PhoneObj[] = []
    if (Array.isArray(barbershop.phones)) {
        if (typeof barbershop.phones[0] === 'string') {
            phones = (barbershop.phones as string[]).map(p => ({ number: p, isWhatsapp: false }))
        } else {
            phones = barbershop.phones as PhoneObj[]
        }
    }

    // Rating (Resumo)
    const ratings = barbershop.ratings || []
    const totalRatings = ratings.length
    const averageRating = totalRatings > 0 ? ratings.reduce((acc, r) => acc + r.stars, 0) / totalRatings : 5.0

    return (
        <div className="sticky top-6">
            <Card className="bg-[#1A1B1F]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl ring-1 ring-white/5">
                <CardContent className="p-0 space-y-8">

                    {/* Mapa */}
                    <div className="relative w-full h-[200px] rounded-xl overflow-hidden border border-white/10 cursor-pointer group shadow-lg" onClick={handleOpenMap}>
                        <Image src="/map.png" fill className="object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500" alt="Mapa" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-primary p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300 ring-4 ring-primary/20">
                                <MapPinIcon size={24} className="text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Info Básica */}
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{barbershop.name}</h3>
                        <button onClick={handleCopyAddress} className="text-left text-sm text-gray-400 hover:text-white transition-colors flex items-start gap-2 group">
                            <MapPinIcon size={16} className="mt-0.5 shrink-0 text-primary group-hover:animate-bounce" />
                            <span className="leading-relaxed border-b border-transparent group-hover:border-gray-500">{barbershop.address}</span>
                        </button>
                    </div>

                    {/* Instagram */}
                    {barbershop.instagram && (
                        <Button variant="outline" className="w-full border-pink-500/20 text-pink-500 hover:bg-pink-500/10 hover:border-pink-500/50 h-10 font-medium transition-all" onClick={() => window.open(`https://instagram.com/${barbershop.instagram?.replace('@', '')}`, '_blank')}>
                            <Instagram size={18} className="mr-2" /> {barbershop.instagram}
                        </Button>
                    )}

                    {/* Sobre */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <h4 className="font-bold text-white text-xs tracking-widest uppercase">Sobre Nós</h4>
                            <span className="h-px flex-1 bg-white/10"></span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed text-justify">
                            {barbershop.description || "Descrição não disponível."}
                        </p>
                    </div>

                    {/* Comodidades */}
                    {barbershop.amenities && barbershop.amenities.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h4 className="font-bold text-white text-xs tracking-widest uppercase">Comodidades</h4>
                                <span className="h-px flex-1 bg-white/10"></span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {barbershop.amenities.map(a => {
                                    const Item = amenityIcons[a]
                                    if (!Item) return null
                                    return (
                                        <div key={a} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-full border border-white/5 hover:border-primary/40 hover:bg-primary/10 transition-all group cursor-default">
                                            <Item.icon size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
                                            <span className="text-[10px] font-bold text-gray-300 group-hover:text-white uppercase tracking-wide">{Item.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Contatos */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <h4 className="font-bold text-white text-xs tracking-widest uppercase">Contatos</h4>
                            <span className="h-px flex-1 bg-white/10"></span>
                        </div>
                        <div className="space-y-2">
                            {phones.map((phone, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-[#141518] rounded-xl px-4 py-3 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3 text-white text-sm">
                                        <div className="p-1.5 bg-white/5 rounded-full">
                                            <PhoneIcon size={14} className="text-gray-400" />
                                        </div>
                                        {phone.number}
                                    </div>
                                    {phone.isWhatsapp ? (
                                        <Button variant="secondary" size="sm" className="h-8 text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400 border border-green-500/20" onClick={() => window.open(`https://wa.me/55${phone.number.replace(/\D/g, "")}`, '_blank')}>
                                            <MessageCircle size={14} className="mr-1.5" /> WhatsApp
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-white/10 text-gray-400 hover:text-white" onClick={() => { navigator.clipboard.writeText(phone.number); toast.success("Copiado!") }}>
                                            Copiar
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Horários */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <h4 className="font-bold text-white text-xs tracking-widest uppercase">Horários</h4>
                            <span className="h-px flex-1 bg-white/10"></span>
                        </div>
                        <div className="space-y-2 bg-[#141518] p-4 rounded-xl border border-white/5">
                            {openingHours.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0 last:pb-0 first:pt-0">
                                    <span className="text-gray-400">{item.day}</span>
                                    <span className={`font-medium ${item.isOpen ? "text-white" : "text-red-500"}`}>
                                        {item.isOpen ? `${item.open} - ${item.close}` : "Fechado"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagamento */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <h4 className="font-bold text-white text-xs tracking-widest uppercase">Pagamento</h4>
                            <span className="h-px flex-1 bg-white/10"></span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {barbershop.paymentMethods.map((method) => (
                                <div key={method} className="flex items-center gap-2 px-3 py-1.5 bg-[#141518] rounded-lg border border-white/5 text-[11px] text-gray-300 font-medium">
                                    <CreditCardIcon size={12} className="text-primary" />
                                    {method}
                                </div>
                            ))}
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}

export default SidebarRight