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

    const maxTotal = Math.max(...data.map((d) => d.total)) || 0

    return (
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
            <div
                className="flex items-end h-[280px] pt-10 px-2 gap-1 sm:gap-1.5"
                style={{ minWidth: data.length > 12 ? `${data.length * 30}px` : "100%" }}
            >
                {data.map((item, index) => {
                    const heightPercentage = maxTotal > 0 ? Math.round((item.total / maxTotal) * 100) : 0
                    const isMax = item.total === maxTotal && maxTotal > 0
                    const isHigh = item.total > maxTotal * 0.7 && !isMax
                    const isMedium = item.total > maxTotal * 0.3 && item.total <= maxTotal * 0.7

                    let barColor = "bg-primary/10"
                    if (isMax) barColor = "bg-primary shadow-[0_0_20px_rgba(129,91,64,0.3)]"
                    else if (isHigh) barColor = "bg-primary/70"
                    else if (isMedium) barColor = "bg-primary/40"

                    return (
                        <div key={index} className="group relative flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-10 pointer-events-none shadow-2xl scale-75 group-hover:scale-100 origin-bottom">
                                {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.total)}
                            </div>

                            <div
                                className={`w-full rounded-t-[4px] transition-all duration-700 ease-out cursor-pointer relative min-h-[2px] ${barColor} group-hover:brightness-125`}
                                style={{ height: `${heightPercentage}%` }}
                            >
                                {isMax && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                                        <span className="text-[7px] font-black text-primary animate-pulse whitespace-nowrap">BEST</span>
                                        <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
                                    </div>
                                )}
                            </div>
                            <span className={`text-[8px] sm:text-[9px] uppercase font-bold transition-colors duration-300 ${isMax ? 'text-primary' : 'text-gray-600 group-hover:text-gray-300'}`}>
                                {item.date}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default AdminOverviewChart