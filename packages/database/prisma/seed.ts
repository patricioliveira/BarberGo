const { PrismaClient } = require("@prisma/client");
const { generateSlug } = require("../../../packages/shared/src/utils");

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    // 1. Limpar o banco de dados para evitar duplicatas
    await prisma.booking.deleteMany();
    await prisma.barberStaff.deleteMany();
    await prisma.barbershopService.deleteMany();
    await prisma.barbershop.deleteMany();
    await prisma.user.deleteMany();

    console.log("Bando de dados limpo com sucesso!");

    // 2. Criar Usuário Admin (Dono das Barbearias)
    const adminUser = await prisma.user.create({
      data: {
        name: "Patrício Admin",
        email: "admin@barbergo.com.js",
        role: "ADMIN",
        // A senha deve ser criptografada no sistema real, mas aqui é apenas para seed
        password: "password123",
      },
    });

    // 3. Configurações padrão
    const paymentMethods = ["Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro"];

    const defaultOpeningHours = [
      { day: "Segunda-feira", open: "09:00", close: "19:00", isOpen: true },
      { day: "Terça-feira", open: "09:00", close: "19:00", isOpen: true },
      { day: "Quarta-feira", open: "09:00", close: "19:00", isOpen: true },
      { day: "Quinta-feira", open: "09:00", close: "19:00", isOpen: true },
      { day: "Sexta-feira", open: "09:00", close: "19:00", isOpen: true },
      { day: "Sábado", open: "09:00", close: "15:00", isOpen: true },
      { day: "Domingo", open: "00:00", close: "00:00", isOpen: false },
    ];

    const images = [
      "https://utfs.io/f/c97a2dc9-cf62-468b-a851-bfd2bdde775f-16p.png",
      "https://utfs.io/f/45331760-899c-4b4b-910e-e00babb6ed81-16q.png",
      "https://utfs.io/f/5832df58-cfd7-4b3f-b102-42b7e150ced2-16r.png",
      "https://utfs.io/f/7e309eaa-d722-465b-b8b6-76217404a3d3-16s.png",
      "https://utfs.io/f/178da6b6-6f9a-424a-be9d-a2feb476eb36-16t.png",
    ];

    const creativeNames = ["Barbearia Vintage", "Corte & Estilo", "Barba & Navalha", "The Dapper Den", "Machado & Tesoura"];
    const addresses = ["Rua da Barbearia, 123", "Avenida dos Cortes, 456", "Praça da Barba, 789", "Travessa da Navalha, 101", "Alameda dos Estilos, 202"];

    const serviceTemplates = [
      { name: "Corte de Cabelo", description: "Estilo personalizado.", price: 60.0, duration: 45, imageUrl: "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png" },
      { name: "Barba", description: "Modelagem completa.", price: 40.0, duration: 30, imageUrl: "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png" },
      { name: "Pézinho", description: "Acabamento perfeito.", price: 35.0, duration: 15, imageUrl: "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png" },
    ];

    // 4. Criar Barbearias com Staff e Serviços
    for (let i = 0; i < creativeNames.length; i++) {
      const barbershop = await prisma.barbershop.create({
        data: {
          name: creativeNames[i],
          slug: generateSlug(creativeNames[i]),
          address: addresses[i],
          imageUrl: images[i % images.length],
          phones: ["(11) 99999-9999"],
          description: "Sua melhor experiência em cuidados masculinos.",
          isExclusive: i === 0, // A primeira é exclusiva
          paymentMethods: paymentMethods,
          openingHours: defaultOpeningHours,
          ownerId: adminUser.id, // Vincula ao dono
          services: {
            create: serviceTemplates.map(s => ({
              name: s.name,
              description: s.description,
              price: s.price,
              duration: s.duration,
              imageUrl: s.imageUrl
            }))
          },
          staff: {
            create: [
              {
                name: `Barbeiro Junior ${i + 1}`,
                jobTitle: "Especialista em Cortes",
                email: `junior${i}@barbergo.com`,
                isActive: true,
                openingHours: defaultOpeningHours,
              },
              {
                name: `Mestre ${creativeNames[i]}`,
                jobTitle: "Senior Barber",
                email: `mestre${i}@barbergo.com`,
                isActive: true,
                openingHours: defaultOpeningHours,
              }
            ]
          }
        },
      });

      console.log(`Barbearia "${barbershop.name}" criada!`);
    }

    // 5. Criar um usuário STAFF vinculado a um perfil profissional (Para testes de login)
    const staffUser = await prisma.user.create({
      data: {
        name: "Carlos Barbeiro",
        email: "carlos@barber.com",
        role: "STAFF",
        password: "password123",
      }
    });

    // Pegar a primeira barbearia criada para adicionar o Carlos
    const firstShop = await prisma.barbershop.findFirst();

    await prisma.barberStaff.create({
      data: {
        name: "Carlos Barbeiro",
        jobTitle: "Barbeiro Chefe",
        email: "carlos@barber.com",
        userId: staffUser.id,
        barbershopId: firstShop.id,
        openingHours: defaultOpeningHours,
        isActive: true,
      }
    });

    console.log("Seed finalizado com sucesso!");

  } catch (error) {
    console.error("Erro no processo de seed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();