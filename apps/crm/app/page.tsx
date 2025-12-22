import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { db } from "@barbergo/database"
import { authOptions } from "./_lib/auth"
import PartnerDashboard from "./_components/partner-dashboard"
import OwnerDashboard from "./_components/owner-dashboard"

export default async function CRMRootPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return <div>Acesso negado.</div>
    }

    const user = await db.user.findUnique({
        // O TS agora reconhecerá session.user.id sem erro
        where: { id: session.user.id },
        include: { referredBarbershops: { include: { subscription: true } } }
    })

    // 3. Renderização Condicional com Fallback
    if (user?.role === "SUPER_ADMIN") {
        return <OwnerDashboard />
    }

    if (user?.role === "PARTNER") {
        return <PartnerDashboard partner={user} />
    }

    // 4. Tela de erro amigável (ou redirecionamento para o app principal)
    return (
        <div className="flex h-screen flex-col items-center justify-center p-10 text-center">
            <h1 className="text-2xl font-bold text-red-500">Acesso Restrito</h1>
            <p className="mt-2 text-gray-400">
                Esta área é exclusiva para administradores e parceiros do BarberGo.
            </p>
            <a href="/" className="mt-6 text-primary underline">Voltar para a Home</a>
        </div>
    )
}