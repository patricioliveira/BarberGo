"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
    Button,
    Input,
    Label,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@barbergo/ui"
import {
    Save,
    ArrowLeft,
    Plus,
    Trash2,
    Clock,
    Phone,
    Store,
    MapPin,
    CreditCard,
    UserPlus,
    Scissors,
    Check,
    X,
    Loader2
} from "lucide-react"

// Importação das Actions (Certifique-se de criá-las conforme discutido)
import { updateBarbershopSettings } from "../../_actions/update-barbershop-settings"
import { ConfirmDialog } from "../../_components/confirm-dialog"
import { getBarbershopSettings } from "@/_actions/get-barbershop-settings"

// --- COMPONENTE SWITCH ESTILIZADO ---
const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (c: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${checked ? 'bg-primary' : 'bg-slate-700'}`}
    >
        <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
)

type StaffMember = { id: string; name: string; email: string; jobTitle: string }
type Service = { id: string; name: string; description: string; price: string; duration: number }
type WorkingHour = { day: string; open: string; close: string; isOpen: boolean }

const DEFAULT_HOURS: WorkingHour[] = [
    { day: "Segunda-feira", open: "09:00", close: "19:00", isOpen: true },
    { day: "Terça-feira", open: "09:00", close: "19:00", isOpen: true },
    { day: "Quarta-feira", open: "09:00", close: "19:00", isOpen: true },
    { day: "Quinta-feira", open: "09:00", close: "19:00", isOpen: true },
    { day: "Sexta-feira", open: "09:00", close: "19:00", isOpen: true },
    { day: "Sábado", open: "09:00", close: "15:00", isOpen: true },
    { day: "Domingo", open: "00:00", close: "00:00", isOpen: false },
]

export default function SettingsPage() {
    const router = useRouter()
    const [isDirty, setIsDirty] = useState(false)
    const [activeTab, setActiveTab] = useState("general")
    const [isLoading, setIsLoading] = useState(true)

    const [dialogConfig, setDialogConfig] = useState<{
        isOpen: boolean; title: string; description: string; onConfirm: () => void; variant?: "default" | "destructive";
    }>({ isOpen: false, title: "", description: "", onConfirm: () => { } })

    const [storeData, setStoreData] = useState({ id: "", name: "", address: "", phones: [] as string[], paymentMethods: [] as string[], isClosed: false })
    const [hours, setHours] = useState<WorkingHour[]>(DEFAULT_HOURS)
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [customPayment, setCustomPayment] = useState("")

    const formatPhone = (value: string) => {
        const n = value.replace(/\D/g, "")
        if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
        return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }

    useEffect(() => {
        const load = async () => {
            const data = await getBarbershopSettings()
            if (data) {
                setStoreData({
                    id: data.id,
                    name: data.name || "",
                    address: data.address || "",
                    phones: data.phones || [],
                    paymentMethods: data.paymentMethods || [],
                    isClosed: data.isClosed || false
                })

                if (data.openingHours) setHours(data.openingHours as unknown as WorkingHour[])

                // Mapeamento corrigido para satisfazer o TypeScript
                setStaff(data.staff.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    email: s.email || "",
                    jobTitle: s.jobTitle
                })))

                setServices(data.services.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    description: s.description || "",
                    price: s.price,
                    duration: s.duration
                })))
            }
            setIsLoading(false)
        }
        load()
    }, [])

    const openConfirm = (title: string, description: string, onConfirm: () => void, variant: "default" | "destructive" = "default") => {
        setDialogConfig({ isOpen: true, title, description, onConfirm, variant })
    }

    const handleBack = () => {
        if (isDirty) openConfirm("Descartar alterações?", "Você tem modificações não salvas que serão perdidas.", () => router.back(), "destructive")
        else router.back()
    }

    const handleSave = async () => {
        const res = await updateBarbershopSettings({ barbershopId: storeData.id, storeData, hours, services, staff })
        if (res.success) { setIsDirty(false); alert("Configurações salvas!") }
        else alert(res.error)
    }

    if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white gap-4"><Loader2 className="animate-spin text-primary" size={40} /><p>Carregando...</p></div>
    
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl pb-24">

            {/* COMPONENTE ÚNICO DE ALERTA */}
            <ConfirmDialog
                isOpen={dialogConfig.isOpen}
                onOpenChange={(open) => setDialogConfig({ ...dialogConfig, isOpen: open })}
                title={dialogConfig.title}
                description={dialogConfig.description}
                onConfirm={dialogConfig.onConfirm}
                variant={dialogConfig.variant}
                confirmText="Confirmar"
                cancelText="Cancelar"
            />

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleBack} className="text-white hover:bg-secondary">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-white">Configurações</h1>
                </div>
                <div className="flex items-center gap-3">
                    {isDirty && <span className="text-xs text-amber-500 font-bold animate-pulse">ALTERAÇÕES PENDENTES</span>}
                    <Button onClick={handleSave} disabled={!isDirty}>
                        <Save className="mr-2 h-4 w-4" /> Salvar Tudo
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8 bg-[#1A1B1F] p-1 h-auto">
                    <TabsTrigger value="general" className="py-2">Geral</TabsTrigger>
                    <TabsTrigger value="hours" className="py-2">Horários</TabsTrigger>
                    <TabsTrigger value="services" className="py-2">Serviços</TabsTrigger>
                    <TabsTrigger value="staff" className="py-2">Equipe</TabsTrigger>
                </TabsList>

                {/* ABA GERAL */}
                <TabsContent value="general" className="space-y-6">
                    <Card className="bg-[#1A1B1F] border-none text-white">
                        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Store size={20} /> Unidade</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border border-secondary rounded-lg bg-black/20">
                                <div><Label className="text-base">Status da Unidade</Label></div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold ${storeData.isClosed ? 'text-red-500' : 'text-green-500'}`}>
                                        {storeData.isClosed ? 'LOJA FECHADA' : 'LOJA ABERTA'}
                                    </span>
                                    <Switch checked={!storeData.isClosed} onCheckedChange={(val) => { setStoreData({ ...storeData, isClosed: !val }); setIsDirty(true) }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Nome</Label><Input value={storeData.name} onChange={e => { setStoreData({ ...storeData, name: e.target.value }); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                <div className="space-y-2"><Label>Endereço</Label><Input value={storeData.address} onChange={e => { setStoreData({ ...storeData, address: e.target.value }); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                            </div>

                            <div className="space-y-4 border-t border-secondary pt-6">
                                <Label className="flex items-center gap-2"><Phone size={16} /> Contatos</Label>
                                {storeData.phones.map((phone, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input
                                            value={formatPhone(phone)}
                                            maxLength={15}
                                            onChange={e => {
                                                const newPhones = [...storeData.phones]
                                                newPhones[i] = e.target.value.replace(/\D/g, "")
                                                setStoreData({ ...storeData, phones: newPhones }); setIsDirty(true)
                                            }}
                                            className="bg-secondary border-none"
                                        />
                                        <Button variant="destructive" size="icon" onClick={() => {
                                            setStoreData({ ...storeData, phones: storeData.phones.filter((_, idx) => idx !== i) }); setIsDirty(true)
                                        }}><Trash2 size={16} /></Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => { setStoreData({ ...storeData, phones: [...storeData.phones, ""] }); setIsDirty(true) }} className="w-full border-dashed"><Plus size={16} className="mr-2" /> Adicionar Telefone</Button>
                            </div>

                            <div className="space-y-4 border-t border-secondary pt-6">
                                <Label className="flex items-center gap-2"><CreditCard size={16} /> Pagamentos</Label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {["Pix", "Dinheiro", "Visa", "Mastercard", "Elo"].map(method => {
                                        const active = storeData.paymentMethods.includes(method)
                                        return (
                                            <Button
                                                key={method}
                                                variant={active ? "default" : "outline"}
                                                size="sm"
                                                className="rounded-full h-8 text-xs"
                                                onClick={() => {
                                                    const next = active ? storeData.paymentMethods.filter(m => m !== method) : [...storeData.paymentMethods, method]
                                                    setStoreData({ ...storeData, paymentMethods: next }); setIsDirty(true)
                                                }}
                                            >
                                                {active && <Check size={14} className="mr-1" />} {method}
                                            </Button>
                                        )
                                    })}
                                    {storeData.paymentMethods.filter(m => !["Pix", "Dinheiro", "Visa", "Mastercard", "Elo"].includes(m)).map(m => (
                                        <Button key={m} variant="default" size="sm" className="rounded-full h-8 text-xs bg-indigo-600" onClick={() => {
                                            setStoreData({ ...storeData, paymentMethods: storeData.paymentMethods.filter(pm => pm !== m) }); setIsDirty(true)
                                        }}><X size={14} className="mr-1" /> {m}</Button>
                                    ))}
                                </div>
                                <div className="flex gap-2 max-w-sm">
                                    <Input placeholder="Personalizado..." value={customPayment} onChange={e => setCustomPayment(e.target.value)} className="bg-secondary border-none h-9 text-xs" />
                                    <Button size="sm" onClick={() => { if (customPayment) { setStoreData({ ...storeData, paymentMethods: [...storeData.paymentMethods, customPayment] }); setCustomPayment(""); setIsDirty(true) } }}>Add</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ABA HORÁRIOS */}
                <TabsContent value="hours">
                    <Card className="bg-[#1A1B1F] border-none text-white">
                        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Clock size={20} /> Funcionamento</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {hours.map((h, i) => (
                                <div key={h.day} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b border-secondary/40 last:border-0 gap-3">
                                    <div className="flex items-center gap-4 min-w-[150px]">
                                        <Switch checked={h.isOpen} onCheckedChange={(val) => { const n = [...hours]; n[i].isOpen = val; setHours(n); setIsDirty(true) }} />
                                        <span className={h.isOpen ? "font-medium" : "text-gray-600"}>{h.day}</span>
                                    </div>
                                    {h.isOpen ? (
                                        <div className="flex items-center gap-2">
                                            <Input type="time" value={h.open} onChange={e => { const n = [...hours]; n[i].open = e.target.value; setHours(n); setIsDirty(true) }} className="w-24 bg-secondary border-none h-8 p-1" />
                                            <span className="text-gray-600">às</span>
                                            <Input type="time" value={h.close} onChange={e => { const n = [...hours]; n[i].close = e.target.value; setHours(n); setIsDirty(true) }} className="w-24 bg-secondary border-none h-8 p-1" />
                                        </div>
                                    ) : <span className="text-xs italic text-gray-600">Fechado</span>}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ABA SERVIÇOS */}
                <TabsContent value="services" className="space-y-4">
                    <div className="flex justify-end"><Button size="sm" onClick={() => { setServices([...services, { id: Date.now().toString(), name: "", description: "", price: "0.00", duration: 30 }]); setIsDirty(true) }}><Plus size={16} className="mr-2" /> Novo Serviço</Button></div>
                    {services.map((s, i) => (
                        <Card key={s.id} className="bg-[#1A1B1F] border border-secondary/40 text-white p-4">
                            <div className="grid md:grid-cols-3 gap-4 mb-4">
                                <div className="space-y-1"><Label className="text-xs">Serviço</Label><Input value={s.name} onChange={e => { const n = [...services]; n[i].name = e.target.value; setServices(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                <div className="space-y-1"><Label className="text-xs">Preço (R$)</Label><Input type="number" value={s.price} onChange={e => { const n = [...services]; n[i].price = e.target.value; setServices(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                <div className="space-y-1"><Label className="text-xs">Minutos</Label><Input type="number" value={s.duration} onChange={e => { const n = [...services]; n[i].duration = parseInt(e.target.value); setServices(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                            </div>
                            <div className="flex gap-2">
                                <Input placeholder="Descrição..." value={s.description} onChange={e => { const n = [...services]; n[i].description = e.target.value; setServices(n); setIsDirty(true) }} className="bg-secondary border-none h-8 text-xs" />
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => { setServices(services.filter(sv => sv.id !== s.id)); setIsDirty(true) }}><Trash2 size={14} /></Button>
                            </div>
                        </Card>
                    ))}
                </TabsContent>

                {/* ABA EQUIPE */}
                <TabsContent value="staff" className="space-y-4">
                    <div className="flex justify-end"><Button size="sm" onClick={() => { setStaff([...staff, { id: Date.now().toString(), name: "", email: "", jobTitle: "Barbeiro" }]); setIsDirty(true) }}><UserPlus size={16} className="mr-2" /> Convidar Profissional</Button></div>
                    {staff.map((m, i) => (
                        <div key={m.id} className="p-4 border border-secondary/40 rounded-xl bg-[#1A1B1F] flex flex-col md:flex-row gap-4">
                            <div className="flex-1 grid md:grid-cols-3 gap-3">
                                <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={m.name} onChange={e => { const n = [...staff]; n[i].name = e.target.value; setStaff(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                <div className="space-y-1"><Label className="text-xs">E-mail</Label><Input value={m.email} onChange={e => { const n = [...staff]; n[i].email = e.target.value; setStaff(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                <div className="space-y-1"><Label className="text-xs">Cargo</Label><Input value={m.jobTitle} onChange={e => { const n = [...staff]; n[i].jobTitle = e.target.value; setStaff(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 self-end md:self-center"
                                onClick={() => openConfirm(
                                    "Remover Profissional?",
                                    `Tem certeza que deseja remover ${m.name || "este membro"} da equipe?`,
                                    () => { setStaff(staff.filter(s => s.id !== m.id)); setIsDirty(true) },
                                    "destructive"
                                )}
                            >
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    )
}