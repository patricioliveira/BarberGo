import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    Button,
    Badge
} from "@barbergo/ui"
import { CheckCircle2, Clock, AlertCircle, Printer, Share2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

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

    const handleShare = async () => {
        const shareData = {
            title: 'Fatura BarberGo',
            text: `Comprovante de pagamento ${barbershopName ? `- ${barbershopName}` : ''}\nValor: ${Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(invoice.amount))}\nReferência: ${invoice.reference || invoice.id}`,
            url: window.location.href // Opcional
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData)
                toast.success("Compartilhado com sucesso!")
            } catch (error) {
                console.error("Erro ao compartilhar", error)
            }
        } else {
            // Fallback: Copiar para área de transferência
            try {
                await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`)
                toast.success("Detalhes copiados para a área de transferência.")
            } catch (err) {
                toast.error("Não foi possível compartilhar.")
            }
        }
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
            {/* Ajuste de largura e bordas para mobile */}
            <SheetContent className="w-full h-full md:h-auto sm:max-w-md bg-[#141518] border-l border-white/5 text-white overflow-y-auto p-0 md:p-6 md:rounded-l-2xl pt-safe pb-safe">
                <SheetHeader className="mb-6 p-6 md:p-0 pb-0">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-white text-xl font-bold">Detalhes da Fatura</SheetTitle>
                        <Badge className={`${status.bg} ${status.color} border-none`}>{status.label}</Badge>
                    </div>
                </SheetHeader>

                <div className="space-y-6 p-6 md:p-0 pt-0 print:p-0 print:bg-white print:text-black">
                    {/* Cabeçalho da Fatura */}
                    <div className="p-4 md:p-6 bg-[#1A1B1F] rounded-2xl border border-white/5 space-y-4 print:border text-center print:bg-white print:text-black">
                        <div className="space-y-1">
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Valor Total</p>
                            <h2 className="text-3xl md:text-4xl font-black text-white print:text-black">
                                {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(invoice.amount))}
                            </h2>
                            {Number(invoice.discount) > 0 && (
                                <p className="text-xs text-green-500 font-bold uppercase mt-1">
                                    Desconto aplicado: {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(invoice.discount))}
                                </p>
                            )}
                        </div>
                        <div className="h-[1px] bg-white/5 w-full" />
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Vencimento</p>
                                <p className="text-xs md:text-sm font-bold">{invoice.createdAt ? format(new Date(invoice.createdAt), "dd/MM/yyyy") : "-"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Referência</p>
                                <p className="text-xs md:text-sm font-bold">{invoice.reference || `#${invoice.id.slice(0, 8)}`}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detalhes do Item */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Itens do Pedido</h3>
                        <div className="flex justify-between items-center p-4 bg-[#1A1B1F] rounded-xl border border-white/5 print:bg-white print:border-gray-200">
                            <div>
                                <p className="font-bold text-white text-sm md:text-base print:text-black">Assinatura BarberGo PRO</p>
                                <p className="text-[10px] md:text-xs text-gray-500">Mensalidade - {barbershopName}</p>
                            </div>
                            <p className="font-bold text-sm md:text-base">{Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(invoice.amount) + Number(invoice.discount || 0))}</p>
                        </div>
                        {Number(invoice.discount) > 0 && (
                            <div className="flex justify-between items-center p-4 bg-green-500/10 rounded-xl border border-green-500/20 print:bg-white print:border-green-200">
                                <div>
                                    <p className="font-bold text-green-500 text-sm md:text-base print:text-black">Desconto Promocional (Indicação)</p>
                                    <p className="text-[10px] md:text-xs text-green-400/70">Recompensa aplicada</p>
                                </div>
                                <p className="font-bold text-sm md:text-base text-green-500">- {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(invoice.discount))}</p>
                            </div>
                        )}
                    </div>

                    {/* Método de Pagamento */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pagamento</h3>
                        <div className="p-4 bg-[#1A1B1F] rounded-xl border border-white/5 space-y-2 print:bg-white print:border-gray-200">
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="text-gray-500">Método</span>
                                <span className="font-bold text-white print:text-black uppercase">{invoice.method || "Cartão de Crédito"}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="text-gray-500">Status</span>
                                <span className={`font-bold ${status.color} print:text-black`}>{status.label}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm">
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
                        <Button
                            variant="outline"
                            className="w-full border-white/10 text-gray-400 hover:text-white h-12 rounded-xl gap-2"
                            onClick={handleShare}
                        >
                            <Share2 size={18} />
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
