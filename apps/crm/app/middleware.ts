// apps/crm/app/middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const role = req.nextauth.token?.role as string
        const pathname = req.nextUrl.pathname

        // Proteção: Apenas SUPER_ADMIN acessa rotas de barbearia
        if (pathname.startsWith("/barbershop") && role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/", req.url))
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/", // Define a raiz como página de login
        },
    }
)

export const config = {
    // Protege sub-rotas. A "/" será controlada internamente no page.tsx
    matcher: [
        "/barbershop/:path*",
        "/admin/:path*",
        "/profile/:path*"
    ],
}