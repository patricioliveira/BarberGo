import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command
} from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT!;
const bucketName = process.env.MINIO_BUCKET || "barbergo";

const s3Client = new S3Client({
    endpoint: endpoint,
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true,
});

/**
 * Realiza o upload de um arquivo para o MinIO
 */
export const uploadFileAsync = async (buffer: Buffer, objectKey: string, contentType: string) => {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
    });

    await s3Client.send(command);

    // Retorna a URL baseada no endpoint do ambiente (HTTP local ou HTTPS prod)
    return `${endpoint}/${bucketName}/${objectKey}`;
};

/**
 * Baixa um arquivo e o converte para string Base64 (equivalente ao C# DownloadFileAsync)
 */
export const downloadFileAsync = async (objectKey: string) => {
    try {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
        });

        const response = await s3Client.send(command);

        // No Node.js, transformamos o stream de resposta em um array de bytes e depois para Base64
        const byteArray = await response.Body?.transformToByteArray();
        if (!byteArray) return "";

        return Buffer.from(byteArray).toString("base64");
    } catch (error) {
        console.error(`Erro ao baixar arquivo ${objectKey}:`, error);
        return "";
    }
};

/**
 * Lista as chaves (keys) de todos os objetos no bucket (equivalente ao C# ListObjectsAsync)
 */
export const listObjectsAsync = async () => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
        });

        const response = await s3Client.send(command);

        // Retorna apenas os nomes (Keys) dos arquivos
        return response.Contents?.map(item => item.Key || "") || [];
    } catch (error) {
        console.error("Erro ao listar objetos:", error);
        return [];
    }
};

/**
 * Verifica se um objeto existe (equivalente ao C# ObjectExistsAsync)
 */
export const objectExistsAsync = async (objectKey: string) => {
    try {
        const command = new HeadObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
        });

        await s3Client.send(command);
        return true;
    } catch (error: any) {
        // Se o erro for 404 (NotFound), o arquivo não existe
        if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        throw error;
    }
};

/**
 * Remove um arquivo do MinIO (equivalente ao C# DeleteFileAsync)
 */
export const deleteFileAsync = async (objectKey: string) => {
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
    });

    await s3Client.send(command);
};