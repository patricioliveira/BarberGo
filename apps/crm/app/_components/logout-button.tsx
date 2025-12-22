// "use client"

// import { signOut } from "next-auth/react"
// import { Button } from "@barbergo/ui"

// export const LogoutButton = () => {
//     return (
//         <Button
//             variant="link"
//             className="mt-4 text-primary underline"
//             onClick={() => signOut({ callbackUrl: "/" })}
//         >
//             Sair e voltar ao App Principal
//         </Button>
//     )
// }

"use client"

import { signOut } from "next-auth/react"
import { Button } from "@barbergo/ui"
import { LogOut } from "lucide-react"

export const LogoutButton = () => {
    return (
        <Button
            variant="ghost"
            className="text-gray-400 hover:text-white gap-2 font-bold uppercase text-xs tracking-widest"
            onClick={() => signOut({ callbackUrl: "/" })}
        >
            <LogOut size={16} />
            Sair
        </Button>
    )
}