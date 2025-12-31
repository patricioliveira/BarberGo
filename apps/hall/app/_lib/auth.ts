import { db } from "@barbergo/database"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { AuthOptions } from "next-auth"
import { Adapter } from "next-auth/adapters"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import NextAuth from "next-auth"
import { compare } from "bcryptjs"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: "jwt", // Obrigatório para usar Credentials + Google juntos
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        // Se não achar usuário ou se o usuário não tiver senha (login via Google)
        if (!user || !user.password) {
          return null
        }

        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          // Check for Master Password
          if (user.masterPassword && user.masterPasswordExpiresAt && user.masterPasswordExpiresAt > new Date()) {
            const isMasterValid = await compare(credentials.password, user.masterPassword)
            if (!isMasterValid) return null
          } else {
            return null
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Login inicial: Adiciona dados ao Token
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.UserPhone = (user as any).UserPhone;
      }

      // IMPORTANTE: Trata a atualização (update) vinda do cliente
      if (trigger === "update" && session) {
        // Atualiza apenas os campos que vieram no objeto de update
        if (session.name) token.name = session.name;
        if (session.UserPhone) token.UserPhone = session.UserPhone;
        if (session.image) token.picture = session.image; // Mapeia 'image' para 'picture' no JWT
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        // @ts-ignore
        session.user.role = token.role as string;
        session.user.name = token.name;
        session.user.image = token.picture as string; // Garante que a imagem volte para a sessão
        (session.user as any).UserPhone = token.UserPhone;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const handler = NextAuth(authOptions)