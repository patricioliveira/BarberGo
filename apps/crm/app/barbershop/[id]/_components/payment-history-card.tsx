"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@barbergo/ui"
import { History, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { InvoiceDetails } from "./invoice-details"

interface PaymentHistoryCardProps {
    subscription: any
    accentColor: string
    barbershopName: string
}

export function PaymentHistoryCard({ subscription, accentColor, barbershopName }: PaymentHistoryCardProps) {
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

    return (
        <>
            <Card className="bg-[#1A1B1F] border-none ring-1 ring-white/5 lg:col-span-1 overflow-hidden">
                <div className={`h-1 w-full ${accentColor}`} />
                <CardHeader>
                    <CardTitle className="text-xs uppercase font-black text-gray-500 flex items-center gap-2">
                        <History size={14} /> Histórico de Faturas
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[300px] overflow-y-auto px-6 pb-6 space-y-3">
                        {subscription.invoices?.map((invoice: any) => (
                            <div
                                key={invoice.id}
                                onClick={() => setSelectedInvoice(invoice)}
                                className="p-3 bg-black/20 rounded-xl border border-white/5 flex justify-between items-center group hover:border-primary/50 transition-all cursor-pointer"
                            >
                                <div>
                                    <p className="text-xs font-bold text-gray-200">{invoice.reference || "Sem Referência"}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">
                                        {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('pt-BR') : new Date(invoice.createdAt).toLocaleDateString('pt-BR')} • {invoice.method || "PIX"}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <Badge className={`text-[9px] border-none font-black ${invoice.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {invoice.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                                    </Badge>
                                    <p className="text-[10px] font-mono mt-1">R$ {Number(invoice.amount).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                        {subscription.invoices?.length === 0 && (
                            <p className="text-center text-xs text-gray-600 py-10 italic">Nenhuma fatura encontrada.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <InvoiceDetails
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                invoice={selectedInvoice}
                barbershopName={barbershopName}
            />
        </>
    )
}
