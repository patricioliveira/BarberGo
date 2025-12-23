import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT, // http://217.216.64.94:9000
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true, // Obrigatório para MinIO
    tls: false, // Adicione isso para permitir conexões HTTP puras
});

export const uploadFileAsync = async (buffer: Buffer, objectKey: string, contentType: string) => {
    const command = new PutObjectCommand({
        Bucket: process.env.MINIO_BUCKET || "barbergo",
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
    });

    await s3Client.send(command);

    // Retorna a URL para salvar no banco
    // Idealmente, usamos o domínio público se ele estiver na porta 9000
    return `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${objectKey}`;
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