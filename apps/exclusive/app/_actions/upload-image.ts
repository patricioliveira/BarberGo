"use server"

import { uploadFileAsync, deleteFileAsync } from "../_lib/storage";
import { resizeImage } from "../_lib/image-helper";
import { revalidatePath } from "next/cache";

export const uploadImageAction = async (formData: FormData, oldImageUrl?: string) => {
    const file = formData.get("file") as File;
    if (!file || file.size === 0) throw new Error("Arquivo inválido.");

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    try {
        // 1. REMOVER IMAGEM ANTIGA (Se existir e for do nosso MinIO)
        const publicUrl = process.env.NEXT_PUBLIC_MINIO_URL!; // Usamos a URL pública para identificar
        const bucket = process.env.MINIO_BUCKET || "barbergo";

        if (oldImageUrl && oldImageUrl.includes(publicUrl)) {
            try {
                // Extrai a key (caminho após o nome do bucket)
                // Ex: https://domain/bucket/uploads/file.jpg -> split(bucket/) -> [..., 'uploads/file.jpg']
                const parts = oldImageUrl.split(`${bucket}/`);
                const key = parts.length > 1 ? parts[1] : null;

                console.log("[STORAGE] Tentando deletar:", { oldImageUrl, bucket, key });

                if (key) {
                    await deleteFileAsync(key);
                    console.log(`[STORAGE] Antiga imagem removida: ${key}`);
                }
            } catch (e) {
                console.error("[STORAGE] Erro ao tentar remover imagem antiga:", e);
                // Não travamos o upload se a deleção falhar (ex: arquivo já não existia)
            }
        }

        // 2. REDIMENSIONAR (1920x1080 é versátil para banners e perfis)
        const { buffer, extension, contentType } = await resizeImage(inputBuffer, 1920, 1080);

        // 3. UPLOAD DA NOVA
        const fileName = `${Date.now()}.${extension}`;
        const objectKey = `uploads/${fileName}`;
        const imageUrl = await uploadFileAsync(buffer, objectKey, contentType);

        revalidatePath("/");
        return { url: imageUrl };
    } catch (error: any) {
        console.error("Erro no processamento/upload:", error);
        throw new Error("Falha ao processar imagem.");
    }
};