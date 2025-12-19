"use client"

interface AdminOverviewChartProps {
    data: { date: string; total: number }[]
}

const AdminOverviewChart = ({ data }: AdminOverviewChartProps) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-[#26272B] rounded-2xl bg-black/10">
                <p className="text-sm">Sem faturamento para o período</p>
            </div>
        )
    }

    const maxTotal = Math.max(...data.map((d) => d.total)) || 1

    return (
        <div className="flex items-end h-[300px] w-full pt-10 px-2">
            {data.map((item, index) => {
                const heightPercentage = Math.round((item.total / maxTotal) * 100)

                return (
                    <div key={index} className="group relative flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div
                            className="w-[70%] bg-primary/20 rounded-t-md hover:bg-primary/50 transition-all cursor-pointer relative min-h-[4px]"
                            style={{ height: `${heightPercentage}%` }}
                        >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl">
                                {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.total)}
                            </div>
                        </div>
                        <span className="text-[9px] text-gray-500 uppercase font-bold">{item.date}</span>
                    </div>
                )
            })}
        </div>
    )
}

export default AdminOverviewChart