import * as React from "react"
import { Input } from "./input"

interface CurrencyInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: number
    onChange: (value: number) => void
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ className, value, onChange, ...props }, ref) => {
        // Formatter
        const formatCurrency = (val: number) => {
            return new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
            }).format(val)
        }

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/\D/g, "")
            const numericValue = Number(rawValue) / 100
            onChange(numericValue)
        }

        return (
            <Input
                ref={ref}
                type="text"
                inputMode="numeric"
                value={formatCurrency(value)}
                onChange={handleChange}
                className={className}
                {...props}
            />
        )
    }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
