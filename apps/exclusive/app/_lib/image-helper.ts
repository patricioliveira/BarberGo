import sharp from "sharp";

export const resizeImage = async (buffer: Buffer, width: number, height: number) => {
    // Sharp detecta o formato automaticamente e processa
    const pipeline = sharp(buffer)
        .resize(width, height, {
            fit: 'cover',
            position: 'center'
        });

    // Mantém o formato original ou converte para JPEG se for desconhecido
    const metadata = await sharp(buffer).metadata();
    const extension = metadata.format || 'jpg';

    const outputBuffer = await pipeline.toBuffer();

    return {
        buffer: outputBuffer,
        extension,
        contentType: `image/${extension}`
    };
};