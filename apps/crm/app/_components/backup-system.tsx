"use client"

import { useState } from "react"
import { Button } from "@barbergo/ui"
import { DatabaseBackup, Loader2 } from "lucide-react"
import { backupDatabase } from "@/app/_actions/system"
import { toast } from "sonner"

export function BackupSystem() {
    const [isLoading, setIsLoading] = useState(false)

    const handleBackup = async () => {
        setIsLoading(true)
        try {
            // @ts-ignore
            const res = await backupDatabase()

            if (res.success && res.url) {
                const a = document.createElement("a")
                a.href = res.url
                a.download = res.filename || "backup.sql"
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                toast.success("Backup realizado e enviado para o Storage!")
            } else {
                toast.error("Erro ao gerar backup.")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao gerar backup.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button onClick={handleBackup} disabled={isLoading} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 gap-2 font-bold">
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <DatabaseBackup size={16} />}
            {isLoading ? "Gerando Dump..." : "Backup do Banco"}
        </Button>
    )
}
