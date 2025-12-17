import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role?: string // ou enum UserRole se você exportar do prisma
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        role?: string
    }
}