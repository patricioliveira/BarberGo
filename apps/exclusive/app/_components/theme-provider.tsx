"use client"

import { useEffect } from "react"

// Function to convert hex to HSL
function hexToHSL(hex: string) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt("0x" + hex[1] + hex[1]);
        g = parseInt("0x" + hex[2] + hex[2]);
        b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
        r = parseInt("0x" + hex[1] + hex[2]);
        g = parseInt("0x" + hex[3] + hex[4]);
        b = parseInt("0x" + hex[5] + hex[6]);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin;
    let h = 0, s = 0, l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return `${h} ${s}% ${l}%`;
}

export function ThemeProvider({
    primaryColor,
    secondaryColor,
    children
}: {
    primaryColor?: string
    secondaryColor?: string
    children: React.ReactNode
}) {
    useEffect(() => {
        const root = document.documentElement

        if (primaryColor) {
            // Update primary color (HSL format required by Shadcn)
            try {
                const hsl = hexToHSL(primaryColor)
                root.style.setProperty("--primary", hsl)
                // Also update ring for focus states
                root.style.setProperty("--ring", hsl)
            } catch (e) { console.error("Invalid primary color", e) }
        } else {
            // Fallback to default (remove inline override)
            root.style.removeProperty("--primary")
            root.style.removeProperty("--ring")
        }

        if (secondaryColor) {
            // Update secondary/background if desired, though secondary is usually an accent
            // The user asked to update "colors" so we might map secondaryColor to --secondary or --background?
            // Usually 'Secondary' in Shadcn is a muted color. 
            // If the user means "Background color", we might want to override --background.
            // But let's stick to updating --secondary for now or just set a custom prop.
            try {
                const hsl = hexToHSL(secondaryColor)
                root.style.setProperty("--background", hsl)
                // Also update card color to match background or slightly lighter?
                // For now, let's keep card as is or match background for simple 2-color themes
                root.style.setProperty("--card", hsl)
            } catch (e) { console.error("Invalid secondary color", e) }

        }
    }, [primaryColor, secondaryColor])

    return <>{children}</>
}
