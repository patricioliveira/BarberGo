"use client"

import { useState, useEffect } from "react"
import { Barbershop, Rating } from "@prisma/client"
import { getBarbershops } from "../_actions/get-barbershops"
import Header from "./header"
import Footer from "./footer"
import Search from "./search"
import BarbershopItem from "./barbershop-item"
import HorizontalScroll from "./horizontal-scroll"
import { Button } from "@barbergo/ui"
import { MapPin, Star, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "../_lib/utils"

interface HomeClientProps {
    initialBarbershops: (Barbershop & { ratings: Rating[] })[]
    initialFavorites: (Barbershop & { ratings: Rating[] })[]
    userName?: string
    formattedDate: string
    defaultSearch?: string
}

export default function HomeClient({ initialBarbershops, initialFavorites, userName, formattedDate, defaultSearch }: HomeClientProps) {
    const [barbershops, setBarbershops] = useState(initialBarbershops)
    const [sortBy, setSortBy] = useState<"rating" | "proximity">("rating")
    const [loading, setLoading] = useState(false)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

    // Quando initialBarbershops muda (ex: nova busca), atualiza o estado
    useEffect(() => {
        setBarbershops(initialBarbershops)
        // Se quiser resetar a ordenação ao buscar, descomente abaixo:
        // setSortBy("rating")
    }, [initialBarbershops])

    const requestLocation = () => {
        setLoading(true)
        if (!navigator.geolocation) {
            alert("Geolocalização não suportada pelo seu navegador.")
            setLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = { lat: position.coords.latitude, lng: position.coords.longitude }
                setUserLocation(loc)
                fetchBarbershops("proximity", loc)
            },
            (error) => {
                console.error("Error getting location:", error)
                setLoading(false)
                if (error.code === error.PERMISSION_DENIED) {
                    alert("Precisamos da sua localização para encontrar barbearias próximas.")
                }
            }
        )
    }

    const fetchBarbershops = async (sort: "rating" | "proximity", location = userLocation) => {
        setLoading(true)
        setSortBy(sort)
        try {
            const data = await getBarbershops({
                lat: location?.lat,
                lng: location?.lng,
                sortBy: sort,
                search: defaultSearch // Mantém o filtro de busca ao ordenar
            })
            setBarbershops(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSortChange = (newSort: "rating" | "proximity") => {
        if (newSort === sortBy && newSort !== 'proximity') return; // Allow re-click proximity to refresh location?

        if (newSort === "proximity") {
            if (!userLocation) {
                requestLocation()
            } else {
                fetchBarbershops("proximity", userLocation)
            }
        } else {
            fetchBarbershops("rating", userLocation)
        }
    }

    return (
        <div className="h-full bg-background min-h-screen flex flex-col">
            <Header />

            <div className="max-w-[1400px] w-full mx-auto px-5 md:px-10 pt-5 space-y-8 flex-1 pb-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-white">
                            {userName ? `Olá, ${userName}!` : "Bem vindo ao BarberGo"}
                        </h2>
                        <p className="capitalize text-sm text-gray-400">
                            {userName ? "Vamos agendar um corte hoje?" : formattedDate}
                        </p>
                    </div>
                    <div className="w-full md:max-w-md">
                        <Search defaultValues={{ search: defaultSearch || "" }} />
                    </div>
                </div>

                {/* Banner */}
                <div className="relative h-[150px] md:h-[300px] lg:h-[400px] w-full rounded-2xl overflow-hidden border border-secondary/50 shadow-2xl">
                    <Image src="/banner2.png" alt="Banner" fill className="object-cover" />
                </div>

                {/* Favorites */}
                {initialFavorites.length > 0 && !defaultSearch && (
                    <div className="space-y-3">
                        <h2 className="text-xs uppercase text-gray-400 font-bold tracking-wider flex items-center gap-2">
                            <Star size={14} className="fill-gray-400" />
                            Meus Favoritos
                        </h2>
                        <HorizontalScroll>
                            {initialFavorites.map(shop => <BarbershopItem key={shop.id} barbershop={shop} />)}
                        </HorizontalScroll>
                    </div>
                )}

                {/* Main List */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-secondary/30 pb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-white">
                                {defaultSearch ? `Resultados para "${defaultSearch}"` : "Barbearias"}
                            </h2>
                            {defaultSearch && (
                                <Link href="/" className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors font-medium">
                                    Limpar filtro
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center bg-secondary/20 p-1 rounded-xl">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("rounded-lg text-xs font-bold transition-all h-8", sortBy === 'rating' ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white")}
                                onClick={() => handleSortChange("rating")}
                            >
                                Melhores Avaliadas
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("rounded-lg text-xs font-bold transition-all h-8", sortBy === 'proximity' ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white")}
                                onClick={() => handleSortChange("proximity")}
                            >
                                {loading && sortBy === 'proximity' ? <Loader2 size={12} className="mr-2 animate-spin" /> : <MapPin size={12} className="mr-2" />}
                                Próximas
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        {loading ? (
                            <div className="flex gap-4 overflow-hidden">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="min-w-[160px] md:min-w-[200px] aspect-[3/4] bg-secondary/30 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : barbershops.length > 0 ? (
                            <HorizontalScroll>
                                {barbershops.map((shop) => (
                                    <BarbershopItem
                                        key={shop.id}
                                        barbershop={shop}
                                    />
                                ))}
                            </HorizontalScroll>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-secondary/10 rounded-3xl border border-secondary/20">
                                <AlertCircle size={40} className="mb-4 opacity-50" />
                                <p className="font-medium">Nenhuma barbearia encontrada.</p>
                                {defaultSearch && <Button variant="link" className="text-primary mt-2" onClick={() => window.location.href = '/'}>Limpar busca</Button>}
                            </div>
                        )}
                    </div>
                </div>

            </div>
            <div className="mt-10">
                <Footer />
            </div>
        </div>
    )
}
