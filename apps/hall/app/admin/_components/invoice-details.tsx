import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    Button,
    Badge
} from "@barbergo/ui"
import { CheckCircle2, Clock, AlertCircle, Ban, Download, Share2, Printer } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface InvoiceDetailsProps {
    isOpen: boolean
    onClose: () => void
    invoice: any
    barbershopName?: string
}

export function InvoiceDetails({ isOpen, onClose, invoice, barbershopName }: InvoiceDetailsProps) {
    if (!invoice) return null

    const handlePrint = () => {
        window.print()
    }

    // Status map local ou recebido via props se quiser unificar
    const statusMap = {
        PAID: { label: "Pago", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2 },
        PENDING: { label: "Pendente", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
        FAILED: { label: "Falhou", color: "text-red-500", bg: "bg-red-500/10", icon: AlertCircle },
    }

    const status = statusMap[invoice.status as keyof typeof statusMap] || statusMap.PAID

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md bg-[#141518] border-l border-white/5 text-white overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-white text-xl font-bold">Detalhes da Fatura</SheetTitle>
                        <Badge className={`${status.bg} ${status.color} border-none`}>{status.label}</Badge>
                    </div>
                </SheetHeader>

                <div className="space-y-6 print:p-0 print:bg-white print:text-black">
                    {/* Cabeçalho da Fatura */}
                    <div className="p-6 bg-[#1A1B1F] rounded-2xl border border-white/5 space-y-4 print:border text-center print:bg-white print:text-black">
                        <div className="space-y-1">
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Valor Total</p>
                            <h2 className="text-4xl font-black text-white print:text-black">
                                {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(invoice.amount))}
                            </h2>
                        </div>
                        <div className="h-[1px] bg-white/5 w-full" />
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Vencimento</p>
                                <p className="text-sm font-bold">{invoice.createdAt ? format(new Date(invoice.createdAt), "dd/MM/yyyy") : "-"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Referência</p>
                                <p className="text-sm font-bold">{invoice.reference || `#${invoice.id.slice(0, 8)}`}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detalhes do Item */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Itens do Pedido</h3>
                        <div className="flex justify-between items-center p-4 bg-[#1A1B1F] rounded-xl border border-white/5 print:bg-white print:border-gray-200">
                            <div>
                                <p className="font-bold text-white print:text-black">Assinatura BarberGo PRO</p>
                                <p className="text-xs text-gray-500">Mensalidade - {barbershopName}</p>
                            </div>
                            <p className="font-bold">{Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(invoice.amount))}</p>
                        </div>
                    </div>

                    {/* Método de Pagamento */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pagamento</h3>
                        <div className="p-4 bg-[#1A1B1F] rounded-xl border border-white/5 space-y-2 print:bg-white print:border-gray-200">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Método</span>
                                <span className="font-bold text-white print:text-black uppercase">{invoice.method || "Cartão de Crédito"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Status</span>
                                <span className={`font-bold ${status.color} print:text-black`}>{status.label}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Data de Pagamento</span>
                                <span className="font-bold text-white print:text-black">
                                    {invoice.paidAt ? format(new Date(invoice.paidAt), "dd/MM/yyyy 'às' HH:mm") : "-"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Ações */}
                    <div className="pt-6 grid gap-3 print:hidden">
                        <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold h-12 rounded-xl" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir / Salvar PDF
                        </Button>
                        <Button variant="outline" className="w-full border-white/10 text-gray-400 hover:text-white h-12 rounded-xl">
                            Compartilhar Comprovante
                        </Button>
                    </div>

                    <div className="hidden print:block text-center text-xs text-gray-500 mt-10">
                        <p>BarberGo - Sistema de Gestão para Barbearias</p>
                        <p>Documento gerado em {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
