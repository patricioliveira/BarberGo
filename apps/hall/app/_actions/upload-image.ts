"use server"

import { uploadToMinio } from "../_lib/storage";
import { revalidatePath } from "next/cache";

export const uploadImageAction = async (formData: FormData) => {
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
        throw new Error("Nenhum arquivo enviado.");
    }

    // Validações básicas
    if (!file.type.startsWith("image/")) {
        throw new Error("O arquivo deve ser uma imagem.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
        const imageUrl = await uploadToMinio(buffer, file.name, file.type);

        // Se quiser salvar no banco imediatamente (ex: no perfil do usuário)
        await db.user.update({ where: { id: session.id }, data: { image: imageUrl } });

        revalidatePath("/");
        return { url: imageUrl };
    } catch (error) {
        console.error(error);
        throw new Error("Falha ao fazer upload da imagem.");
    }
};