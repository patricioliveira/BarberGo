import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const { nextUrl, nextauth } = req
        const token = nextauth.token
        const role = token?.role as string
        const pathname = nextUrl.pathname

        // 1. Proteção para a página de Gerenciamento de Barbearias
        // Apenas SUPER_ADMIN (você) pode acessar detalhes individuais das barbearias
        if (pathname.startsWith("/barbershop")) {
            if (role !== "SUPER_ADMIN") {
                return NextResponse.redirect(new URL("/", req.url))
            }
        }

        // 2. Proteção para rotas genéricas de Admin (se existirem)
        if (pathname.startsWith("/admin")) {
            const hasAccess = role === "SUPER_ADMIN" || role === "ADMIN" || role === "STAFF"
            if (!hasAccess) {
                return NextResponse.redirect(new URL("/", req.url))
            }
        }
    },
    {
        callbacks: {
            // O middleware só permite a passagem se houver um token (usuário logado)
            authorized: ({ token }) => !!token,
        },
        pages: {
            // Se não estiver logado, redireciona para a página de login do CRM
            signIn: "/login",
        },
    }
)

export const config = {
    // Protege a raiz, rotas de barbershop, admin e profile
    matcher: [
        "/",
        "/barbershop/:path*",
        "/admin/:path*",
        "/profile/:path*"
    ],
}