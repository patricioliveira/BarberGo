"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react" // Importação necessária
import {
    Button,
    Input,
    Label,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
    Check,
    X,
    Loader2
} from "lucide-react"

// Importação das Actions
import { updateBarbershopSettings } from "../../_actions/update-barbershop-settings"
import { ConfirmDialog } from "../../_components/confirm-dialog"
import { getBarbershopSettings } from "@/_actions/get-barbershop-settings"
import { addOrUpdateStaff, toggleStaffStatus } from "@/_actions/manage-staff"

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

type StaffMember = { id: string; name: string; email: string; jobTitle: string; isActive: boolean }
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
    const { data: session } = useSession() // Obtendo a sessão do usuário logado
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

                setStaff(data.staff.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    email: s.email || "",
                    jobTitle: s.jobTitle,
                    isActive: s.isActive
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

    const handleAddAdminAsStaff = async () => {
        if (!session?.user) return;
        const res = await addOrUpdateStaff({
            barbershopId: storeData.id,
            name: session.user.name || "",
            email: session.user.email || "",
            jobTitle: "Proprietário / Barbeiro",
            userId: (session.user as any).id
        })
        if (res.success) {
            window.location.reload(); // Recarrega para atualizar a lista
        }
    }

    if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white gap-4"><Loader2 className="animate-spin text-primary" size={40} /><p>Carregando...</p></div>

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl pb-24 text-white">

            <ConfirmDialog
                isOpen={dialogConfig.isOpen}
                onOpenChange={(open) => setDialogConfig({ ...dialogConfig, isOpen: open })}
                title={dialogConfig.title}
                description={dialogConfig.description}
                onConfirm={dialogConfig.onConfirm}
                variant={dialogConfig.variant}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Configurações</h1>
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

                <TabsContent value="general" className="space-y-6">
                    <Card className="bg-[#1A1B1F] border-none text-white">
                        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Store size={20} /> Unidade</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border border-secondary rounded-lg bg-black/20">
                                <Label>Status da Loja</Label>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold ${storeData.isClosed ? 'text-red-500' : 'text-green-500'}`}>{storeData.isClosed ? 'FECHADA' : 'ABERTA'}</span>
                                    <Switch checked={!storeData.isClosed} onCheckedChange={(v) => { setStoreData({ ...storeData, isClosed: !v }); setIsDirty(true) }} />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Nome</Label><Input value={storeData.name} onChange={e => { setStoreData({ ...storeData, name: e.target.value }); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                <div className="space-y-2"><Label>Endereço</Label><Input value={storeData.address} onChange={e => { setStoreData({ ...storeData, address: e.target.value }); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                            </div>
                            <div className="space-y-4 pt-4 border-t border-secondary">
                                <Label className="flex items-center gap-2"><Phone size={16} /> Contatos</Label>
                                {storeData.phones.map((p, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input value={formatPhone(p)} onChange={e => { const n = [...storeData.phones]; n[i] = e.target.value.replace(/\D/g, ""); setStoreData({ ...storeData, phones: n }); setIsDirty(true) }} className="bg-secondary border-none" />
                                        <Button variant="destructive" size="icon" onClick={() => { setStoreData({ ...storeData, phones: storeData.phones.filter((_, idx) => idx !== i) }); setIsDirty(true) }}><Trash2 size={16} /></Button>
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full border-dashed" onClick={() => { setStoreData({ ...storeData, phones: [...storeData.phones, ""] }); setIsDirty(true) }}><Plus size={16} className="mr-2" /> Adicionar Telefone</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hours">
                    <Card className="bg-[#1A1B1F] border-none text-white">
                        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Clock size={20} /> Horários</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {hours.map((h, i) => (
                                <div key={h.day} className="flex justify-between items-center p-3 border-b border-secondary/40 last:border-0">
                                    <div className="flex items-center gap-4 min-w-[150px]"><Switch checked={h.isOpen} onCheckedChange={(v) => { const n = [...hours]; n[i].isOpen = v; setHours(n); setIsDirty(true) }} /><span>{h.day}</span></div>
                                    {h.isOpen ? <div className="flex items-center gap-2"><Input type="time" value={h.open} onChange={e => { const n = [...hours]; n[i].open = e.target.value; setHours(n); setIsDirty(true) }} className="w-24 bg-secondary border-none" /><span>às</span><Input type="time" value={h.close} onChange={e => { const n = [...hours]; n[i].close = e.target.value; setHours(n); setIsDirty(true) }} className="w-24 bg-secondary border-none" /></div> : <span className="text-xs text-gray-600">Fechado</span>}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="services" className="space-y-4">
                    <div className="flex justify-end"><Button size="sm" onClick={() => { setServices([...services, { id: Date.now().toString(), name: "", description: "", price: "0.00", duration: 30 }]); setIsDirty(true) }}><Plus size={16} className="mr-2" /> Novo Serviço</Button></div>
                    {services.map((s, i) => (
                        <Card key={s.id} className="bg-[#1A1B1F] border border-secondary/40 p-4">
                            <div className="grid md:grid-cols-3 gap-4 mb-4">
                                <div><Label className="text-xs">Nome</Label><Input value={s.name} onChange={e => { const n = [...services]; n[i].name = e.target.value; setServices(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                <div><Label className="text-xs">Preço (R$)</Label><Input type="number" value={s.price} onChange={e => { const n = [...services]; n[i].price = e.target.value; setServices(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                <div><Label className="text-xs">Duração (Min)</Label><Input type="number" value={s.duration} onChange={e => { const n = [...services]; n[i].duration = parseInt(e.target.value); setServices(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                            </div>
                            <div className="flex gap-2">
                                <Input placeholder="Descrição..." value={s.description} onChange={e => { const n = [...services]; n[i].description = e.target.value; setServices(n); setIsDirty(true) }} className="bg-secondary border-none flex-1" />
                                <Button variant="destructive" size="icon" onClick={() => { setServices(services.filter(x => x.id !== s.id)); setIsDirty(true) }}><Trash2 size={14} /></Button>
                            </div>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="staff" className="space-y-4">
                    <div className="flex justify-between mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-green-500 text-green-500 bg-transparent hover:bg-green-500/10"
                            onClick={handleAddAdminAsStaff}
                        >
                            Me adicionar como Barbeiro
                        </Button>
                        <Button size="sm" onClick={() => alert("Funcionalidade de convite em desenvolvimento")}>
                            <UserPlus className="mr-2 h-4 w-4" /> Novo Funcionário
                        </Button>
                    </div>

                    {staff.map((m, i) => (
                        <div key={m.id} className={`p-4 border rounded-xl flex items-center justify-between ${!m.isActive ? 'opacity-50 grayscale' : 'bg-black/10 border-secondary'}`}>
                            <div className="flex-1 grid md:grid-cols-3 gap-3 mr-4">
                                <div><Label className="text-xs">Nome</Label><Input value={m.name} onChange={e => { const n = [...staff]; n[i].name = e.target.value; setStaff(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                <div><Label className="text-xs">E-mail</Label><Input value={m.email} disabled className="bg-secondary border-none opacity-70" /></div>
                                <div><Label className="text-xs">Cargo</Label><Input value={m.jobTitle} onChange={e => { const n = [...staff]; n[i].jobTitle = e.target.value; setStaff(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs">{m.isActive ? "Ativo" : "Inativo"}</Label>
                                    <Switch
                                        checked={m.isActive}
                                        onCheckedChange={async (val) => {
                                            await toggleStaffStatus(m.id, val)
                                            const n = [...staff]; n[i].isActive = val; setStaff(n);
                                        }}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    className="text-red-500"
                                    onClick={() => openConfirm("Remover Profissional?", `Deseja remover ${m.name}?`, () => { setStaff(staff.filter(x => x.id !== m.id)); setIsDirty(true) }, "destructive")}
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    )
}