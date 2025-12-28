"use server"

import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import { uploadFileAsync } from "../_lib/storage"

const execAsync = promisify(exec)

// 0. Backup (pg_dump + MinIO)
export const backupDatabase = async () => {
    try {
        const date = new Date()
        const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`
        const filename = `backup_barbergo_crm_${timestamp}.sql` // Plain SQL for easier manual check if needed
        const tempPath = path.join('/tmp', filename)

        if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not defined")

        // Executa pg_dump
        // Usamos formato plain text (.sql) para compatibilidade simples
        await execAsync(`pg_dump "${process.env.DATABASE_URL}" -f "${tempPath}"`)

        // Lê o arquivo gerado
        const fileBuffer = await fs.promises.readFile(tempPath)

        // Upload para o MinIO
        const s3Key = `backups/${filename}`
        const publicUrl = await uploadFileAsync(fileBuffer, s3Key, 'application/sql')

        // Remove arquivo temporário
        await fs.promises.unlink(tempPath)

        return { success: true, url: publicUrl, filename }
    } catch (error) {
        console.error("Backup error:", error)
        throw new Error("Falha ao realizar backup do banco de dados")
    }
}
