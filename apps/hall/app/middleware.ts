import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const { nextUrl, nextauth } = req
        const token = nextauth.token
        const role = token?.role as string
        const pathname = nextUrl.pathname

        // 1. Proteção de Role para rotas de Administração
        // Apenas ADMIN e STAFF podem aceder a /admin e sub-rotas
        if (pathname.startsWith("/admin")) {
            const hasAdminAccess = role === "ADMIN" || role === "STAFF"

            if (!hasAdminAccess) {
                // Se for um USER comum a tentar aceder ao admin, redireciona para a home
                return NextResponse.redirect(new URL("/", req.url))
            }
        }
    },
    {
        callbacks: {
            // O middleware só será executado se o utilizador estiver autenticado
            // Se não estiver, o NextAuth redireciona automaticamente para o login
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/", // Redireciona para a home (onde está o seu diálogo de login) se não houver sessão
        },
    }
)

// Define quais as rotas que o middleware deve monitorizar
export const config = {
    matcher: [
        "/admin",          // Adicione esta linha para proteger a rota exata /admin
        "/admin/:path*",
        "/profile/:path*",
        "/appointments/:path*",
    ],
}