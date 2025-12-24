import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT!;

const s3Client = new S3Client({
    endpoint: endpoint,
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true, // Obrigatório para MinIO
    // Se a URL começar com https, ele ativa o TLS automaticamente
});

export const uploadFileAsync = async (buffer: Buffer, objectKey: string, contentType: string) => {
    const bucketName = process.env.MINIO_BUCKET || "barbergo";

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
    });

    await s3Client.send(command);

    // Retorna a URL baseada no endpoint do ambiente
    // Isso garante que em produção o link gerado seja https://...
    return `${endpoint}/${bucketName}/${objectKey}`;
};

export const objectExistsAsync = async (objectKey: string) => {
    try {
        await s3Client.send(new HeadObjectCommand({ Bucket: process.env.MINIO_BUCKET, Key: objectKey }));
        return true;
    } catch (error: any) {
        if (error.name === "NotFound") return false;
        throw error;
    }
};

export const deleteFileAsync = async (objectKey: string) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: objectKey,
    });
    await s3Client.send(command);
};