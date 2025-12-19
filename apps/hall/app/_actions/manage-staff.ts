"use server"

import { db } from "@barbergo/database"
import { hash } from "bcryptjs" // Certifique-se de ter instalado
import { revalidatePath } from "next/cache"

export const addOrUpdateStaff = async (params: {
    barbershopId: string,
    name: string,
    email: string,
    jobTitle: string,
    userId?: string // Caso seja o próprio admin se adicionando
}) => {
    try {
        let targetUserId = params.userId;

        // Se não for o próprio admin, verifica o e-mail
        if (!targetUserId) {
            const existingUser = await db.user.findUnique({ where: { email: params.email } });

            if (existingUser) {
                targetUserId = existingUser.id;
                // Atualiza o cargo do usuário para STAFF se for comum
                if (existingUser.role === "USER") {
                    await db.user.update({ where: { id: targetUserId }, data: { role: "STAFF" } });
                }
            } else {
                // Cria novo usuário com senha temporária
                const tempPassword = Math.random().toString(36).slice(-8); // Senha aleatória de 8 dígitos
                const hashedPassword = await hash(tempPassword, 10);

                const newUser = await db.user.create({
                    data: {
                        name: params.name,
                        email: params.email,
                        password: hashedPassword,
                        role: "STAFF",
                    }
                });
                targetUserId = newUser.id;

                // TODO: Enviar e-mail aqui com a 'tempPassword'
                console.log(`Usuário criado: ${params.email} | Senha: ${tempPassword}`);
            }
        }

        // Cria o registro de BarberStaff
        await db.barberStaff.create({
            data: {
                name: params.name,
                email: params.email,
                jobTitle: params.jobTitle,
                barbershopId: params.barbershopId,
                userId: targetUserId,
                isActive: true
            }
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        return { error: "Erro ao cadastrar funcionário." };
    }
}

export const toggleStaffStatus = async (staffId: string, isActive: boolean) => {
    await db.barberStaff.update({ where: { id: staffId }, data: { isActive } });
    revalidatePath("/admin/settings");
}