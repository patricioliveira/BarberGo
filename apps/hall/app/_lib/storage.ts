import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT,
    region: "us-east-1", // Minio ignora, mas o SDK pede
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true, // Obrigatório para MinIO self-hosted
});

export const uploadToMinio = async (file: Buffer, fileName: string, contentType: string) => {
    const bucketName = process.env.MINIO_BUCKET!;
    const key = `uploads/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'public-read', // Depende da config do seu bucket no Minio
    });

    await s3Client.send(command);

    // Retorna a URL final da imagem
    return `${process.env.MINIO_ENDPOINT}/${bucketName}/${key}`;
};

export const deleteFromMinio = async (fileUrl: string) => {
    try {
        const bucketName = process.env.MINIO_BUCKET!;
        // Extrai a key da URL (tudo após o nome do bucket)
        const key = fileUrl.split(`${bucketName}/`)[1];

        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        await s3Client.send(command);
    } catch (error) {
        console.error("Erro ao deletar arquivo do Minio:", error);
    }
};