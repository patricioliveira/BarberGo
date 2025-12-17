import { db } from "@barbergo/database"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { AuthOptions } from "next-auth"
import { Adapter } from "next-auth/adapters"
import GoogleProvider from "next-auth/providers/google"
import NextAuth from "next-auth"

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(db) as Adapter,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            session.user = {
                ...session.user,
                id: user.id,
                // @ts-ignore (O TypeScript pode reclamar, mas vamos corrigir a tipagem depois)
                role: user.role,
            } as any
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

export const handler = NextAuth(authOptions)