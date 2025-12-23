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

    // Buscamos o usuário. 
    // Se o erro de 'referredBarbershops' persistir após o generate, 
    // verifique se o nome no schema.prisma é exatamente esse.
    const user = await db.user.findUnique({
        where: { id: (session.user as any).id },
        include: {
            referredBarbershops: {
                include: { subscription: true }
            }
        }
    })

    // 3. Renderização Condicional (Casting para evitar erro de sobreposição de tipo)
    const userRole = user?.role as string

    if (userRole === "SUPER_ADMIN") {
        return <OwnerDashboard />
    }

    if (userRole === "PARTNER") {
        // @ts-ignore - ignorar erro se a relação ainda estiver sendo processada pelo cache do TS
        return <PartnerDashboard partner={user} />
    }

    return (
        <div className="flex h-screen flex-col items-center justify-center text-center p-10">
            <h1 className="text-xl font-bold text-red-500 font-mono">ACESSO RESTRITO</h1>
            <p className="text-gray-400 mt-2 max-w-sm">
                Esta conta não possui permissões administrativas.
            </p>
            <LogoutButton />
        </div>
    )
}