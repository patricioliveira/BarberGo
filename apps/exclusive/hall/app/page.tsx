import { getServerSession } from "next-auth"
import { authOptions } from "./_lib/auth"
import { db } from "@barbergo/database"

 const Home = async () => {
  const session = await getServerSession(authOptions)
  const barbershops = await db.barbershop.findMany({
    where: {
      isExclusive: false,
    },
  })
  const popularBarbershops = await db.barbershop.findMany({
    where: {
      isExclusive: false,
    },
   orderBy: {
       name: "desc",
   },
  })
}