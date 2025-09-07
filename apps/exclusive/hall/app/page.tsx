@@ .. @@
-import Header from "./_components/header"
-import { Button } from "./_components/ui/button"
+import Header from "./_components/header"
+import { Button } from "@barbergo/ui"
 import Image from "next/image"
-import { db } from "./_lib/prisma"
+import { db } from "@barbergo/database"
 import BarbershopItem from "./_components/barbershop-item"
 import { quickSearchOptions } from "./_constants/search"
 import BookingItem from "./_components/booking-item"
@@ .. @@
 const Home = async () => {
   const session = await getServerSession(authOptions)
-  const barbershops = await db.barbershop.findMany({})
+  const barbershops = await db.barbershop.findMany({
+    where: {
+      isExclusive: false,
+    },
+  })
   const popularBarbershops = await db.barbershop.findMany({
+    where: {
+      isExclusive: false,
+    },
     orderBy: {
       name: "desc",
     },
   })