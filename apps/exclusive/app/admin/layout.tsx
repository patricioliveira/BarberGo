import { Button } from "@barbergo/ui"
import { CalendarIcon, HomeIcon, ScissorsIcon, SettingsIcon, LogOutIcon, UsersIcon, StarIcon, ClockIcon } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../_lib/auth"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    // Proteção básica: Se não estiver logado, manda pro login
    if (!session) {
        redirect("/")
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Sidebar Desktop / Mobile Header */}
            <aside className="w-full border-b bg-background md:w-64 md:border-b-0 md:border-r flex-shrink-0">
                <div className="flex h-16 items-center px-6 border-b">
                    <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
                        <ScissorsIcon className="h-6 w-6 text-primary" />
                        <span className="">Gestão</span>
                    </Link>
                </div>

                <nav className="flex flex-row overflow-x-auto p-4 md:flex-col md:space-y-2">
                    <Button variant="ghost" className="justify-start gap-2" asChild>
                        <Link href="/admin">
                            <HomeIcon size={18} />
                            Dashboard
                        </Link>
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2" asChild>
                        <Link href="/admin/my-schedule">
                            <CalendarIcon size={18} />
                            Minha Agenda
                        </Link>
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2" asChild>
                        <Link href="/admin/clients">
                            <UsersIcon size={18} />
                            Clientes
                        </Link>
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2" asChild>
                        <Link href="/admin/ratings">
                            <StarIcon size={18} />
                            Avaliações
                        </Link>
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2" asChild>
                        <Link href="/admin/my-hours">
                            <ClockIcon size={18} />
                            Meus Horários
                        </Link>
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2" asChild>
                        <Link href="/admin/settings">
                            <SettingsIcon size={18} />
                            Configurações
                        </Link>
                    </Button>

                    <div className="md:mt-auto pt-4 border-t md:border-t-0">
                        <Button variant="ghost" className="justify-start gap-2 w-full text-red-500 hover:text-red-600 hover:bg-red-50" asChild>
                            <Link href="/api/auth/signout">
                                <LogOutIcon size={18} />
                                Sair
                            </Link>
                        </Button>
                    </div>
                </nav>
            </aside>

            {/* Conteúdo Principal */}
            <main className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-8">
                {children}
            </main>
        </div>
    )
}