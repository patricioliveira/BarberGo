// apps/crm/app/page.tsx
import { getServerSession } from "next-auth"
import { db } from "@barbergo/database"
import { authOptions } from "./_lib/auth"
import PartnerDashboard from "./_components/partner-dashboard"
import OwnerDashboard from "./_components/owner-dashboard"
import { LogoutButton } from "./_components/logout-button"
import { LoginForm } from "./_components/login-form"

export default async function CRMRootPage() {
    const session = await getServerSession(authOptions)

    // 1. Se NÃO logado: Renderiza a tela de login (sem dialog)
    if (!session?.user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-6">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">BarberGo <span className="text-primary">CRM</span></h1>
                    <p className="text-muted-foreground max-w-md">
                        Gestão centralizada para administradores e parceiros.
                    </p>
                </div>
                <LoginForm />
            </div>
        )
    }

    // 2. Se logado: Busca o Role do usuário no banco
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { referredBarbershops: { include: { subscription: true } } }
    })

    // 3. Renderização Condicional baseada no Role
    if (user?.role === "SUPER_ADMIN") {
        return <OwnerDashboard />
    }

    if (user?.role === "PARTNER") {
        return <PartnerDashboard partner={user} />
    }

    // 4. Fallback: Usuário logado mas sem permissão de CRM
    return (
        <div className="flex h-screen flex-col items-center justify-center text-center p-10">
            <h1 className="text-xl font-bold text-red-500 font-mono">ACESSO RESTRITO</h1>
            <p className="text-gray-400 mt-2 max-w-sm">
                Esta conta não possui permissões administrativas.
                Por favor, utilize uma conta de Administrador ou Parceiro.
            </p>
            <LogoutButton />
        </div>
    )
}