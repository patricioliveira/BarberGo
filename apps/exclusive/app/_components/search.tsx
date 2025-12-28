"use client"

import { SearchIcon } from "lucide-react"
import { Button, Input } from "@barbergo/ui"
import { useRouter } from "next/navigation"
import { useState } from "react"

const Search = () => {
    const router = useRouter()
    const [search, setSearch] = useState("")

    const handleSearch = () => {
        if (!search) return
        // Redireciona para a home (ou uma página de resultados) com o parâmetro de busca
        router.push(`/?search=${search}`)
    }

    return (
        <div className="flex items-center gap-2 mt-6">
            <Input
                placeholder="Buscar Barbearias"
                className="bg-card border-none rounded-xl text-gray-03"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                // Permite buscar ao apertar "Enter"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
                size="icon"
                className="bg-primary hover:bg-primary/80 rounded-xl"
                onClick={handleSearch}
            >
                <SearchIcon size={20} />
            </Button>
        </div>
    )
}

export default Search