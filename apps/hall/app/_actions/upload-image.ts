"use server"

import { resizeImage } from "@/_lib/image-helper";
import { uploadFileAsync } from "../_lib/storage";
import { revalidatePath } from "next/cache";

export const uploadImageAction = async (formData: FormData) => {
    const file = formData.get("file") as File;
    if (!file || file.size === 0) throw new Error("Arquivo inválido.");

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    try {
        // 1. Redimensiona a imagem (Baseado no seu ImageHelper.cs)
        // Usamos 1920x720 para o banner da barbearia ficar nítido
        const { buffer, extension, contentType } = await resizeImage(inputBuffer, 1920, 720);

        // 2. Gera a chave do objeto (caminho no MinIO)
        const fileName = `${Date.now()}.${extension}`;
        const objectKey = `barbershops/${fileName}`;

        // 3. Upload para o MinIO
        const imageUrl = await uploadFileAsync(buffer, objectKey, contentType);

        revalidatePath("/admin/settings");
        return { url: imageUrl };
    } catch (error: any) {
        console.error("Erro no processamento/upload:", error);
        throw new Error("Falha ao processar imagem: " + error.message);
    }
};