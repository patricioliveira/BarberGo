"use client"

import { useState } from "react"
import { Button } from "@barbergo/ui"
import { DatabaseBackup, Loader2, Download } from "lucide-react"
import { backupDatabase } from "@/app/_actions/subscriptions"
import { toast } from "sonner"

export function BackupSystem() {
    const [isLoading, setIsLoading] = useState(false)

    const handleBackup = async () => {
        setIsLoading(true)
        try {
            const data = await backupDatabase()
            
            // Generate filename with date
            const date = new Date()
            const filename = `barbergo_backup_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}.json`
            
            // Create Blob and download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            
            toast.success("Backup realizado e download iniciado!")
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
