"use server"

import { db } from "@barbergo/database"

interface GetBarbershopsProps {
    lat?: number
    lng?: number
    sortBy?: "proximity" | "rating"
    search?: string
}

export async function getBarbershops({ lat, lng, sortBy, search }: GetBarbershopsProps) {
    const barbershops = await db.barbershop.findMany({
        where: search ? {
            name: {
                contains: search,
                mode: 'insensitive',
            },
            // Optionally filter out closed or invisible shops
        } : {},
        include: {
            ratings: true,
        }
    })

    // Calculate Average Rating Helper
    const getAvg = (ratings: any[]) => ratings.length > 0
        ? ratings.reduce((a, b) => a + b.stars, 0) / ratings.length
        : 5.0; // Default to 5.0 if new? Or 0? page.tsx used 5.0 for default sort, let's stick to valid logic.
    // Actually page.tsx used 5.0 if no ratings.

    let results = [...barbershops];

    if (sortBy === 'rating') {
        results.sort((a, b) => getAvg(b.ratings) - getAvg(a.ratings))
    } else if (sortBy === 'proximity' && lat !== undefined && lng !== undefined) {
        results.sort((a, b) => {
            // TODO: Remove explicit casting once Typescript picks up the new Prisma schema changes
            const distA = getDistance(lat, lng, (a as any).latitude, (a as any).longitude);
            const distB = getDistance(lat, lng, (b as any).latitude, (b as any).longitude);
            return distA - distB;
        })
    }

    return results;
}

function getDistance(lat1: number, lon1: number, lat2?: number | null, lon2?: number | null) {
    if (lat2 === null || lat2 === undefined || lon2 === null || lon2 === undefined) return Infinity;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}
