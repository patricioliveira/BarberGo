"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@barbergo/ui"
import {
    Save,
    ArrowLeft,
    Plus,
    Trash2,
    Clock,
    Store,
    UserPlus,
    Check,
    Loader2,
    CreditCard,
    Edit2,
    Camera,
    ImagePlus,
    Instagram,
    MessageCircle,
    Phone as PhoneIcon,
    Wifi,
    Accessibility,
    Car,
    Baby,
    Snowflake,
    Tv,
    Coffee,
    Beer,
    Gamepad2,
    PawPrint,
    Martini,
    User,
    Copy,
    Share2,
    AlertTriangle,
    Palette
} from "lucide-react"

import { updateBarbershopSettings } from "../../_actions/update-barbershop-settings"
import { ConfirmDialog } from "../../_components/confirm-dialog"
import { getBarbershopSettings } from "@/_actions/get-barbershop-settings"
import { addOrUpdateStaff, toggleStaffStatus, deleteStaff } from "@/_actions/manage-staff"
import { uploadImageAction } from "../../_actions/upload-image"
import { updateBarbershopLogo } from "@/_actions/update-images"
import { toast } from "sonner"

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
type ServiceStaffPrice = { staffId: string; price: string; isLinked: boolean }
type Service = { id: string; name: string; description: string; price: string; duration: number; imageUrl: string; staffPrices: ServiceStaffPrice[] }
type WorkingHour = { day: string; open: string; close: string; isOpen: boolean }
type PhoneInput = { number: string; isWhatsapp: boolean }

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
    const { data: session, status } = useSession()

    const [isDirty, setIsDirty] = useState(false)
    const [activeTab, setActiveTab] = useState("general")
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadingServiceId, setUploadingServiceId] = useState<string | null>(null)

    const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false)
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null)
    const [dialogConfig, setDialogConfig] = useState<{
        isOpen: boolean; title: string; description: string; onConfirm: () => void; variant?: "default" | "destructive";
    }>({ isOpen: false, title: "", description: "", onConfirm: () => { } })

    const [newStaff, setNewStaff] = useState({ name: "", email: "", jobTitle: "" })
    const [customPayment, setCustomPayment] = useState("")
    const [isSubmittingStaff, setIsSubmittingStaff] = useState(false)

    const [storeData, setStoreData] = useState({
        id: "",
        name: "",
        address: "",
        imageUrl: "",
        phones: [] as PhoneInput[],
        paymentMethods: [] as string[],
        isClosed: false,
        instagram: "",
        amenities: [] as string[],
        allowOvertime: false,
        requireCancellationApproval: true,
        themeConfig: { primaryColor: "", secondaryColor: "" }
    })

    const [hours, setHours] = useState<WorkingHour[]>(DEFAULT_HOURS)
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [services, setServices] = useState<Service[]>([])

    // Exclusive app assumes plan is EXCLUSIVE implicitly, but we still use the state structure for compat
    // const [currentPlan, setCurrentPlan] = useState<PlanType>(PlanType.EXCLUSIVE) 

    const isAdminAlreadyStaff = staff.some((m) => m.email === session?.user?.email)

    const formatPhone = (value: string) => {
        const n = value.replace(/\D/g, "")
        if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
        return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        if (status === "authenticated") {
            const load = async () => {
                try {
                    const data = await getBarbershopSettings()
                    if (data) {
                        let loadedPhones: PhoneInput[] = []
                        if (Array.isArray(data.phones)) {
                            if (data.phones.length > 0 && typeof data.phones[0] === 'string') {
                                loadedPhones = (data.phones as string[]).map(p => ({ number: p, isWhatsapp: false }))
                            } else {
                                loadedPhones = data.phones as PhoneInput[]
                            }
                        }

                        setStoreData({
                            id: data.id,
                            name: data.name || "",
                            address: data.address || "",
                            imageUrl: data.imageUrl || "",
                            phones: loadedPhones,
                            paymentMethods: data.paymentMethods || [],
                            isClosed: data.isClosed || false,
                            instagram: data.instagram || "",
                            amenities: data.amenities || [],
                            allowOvertime: (data as any).allowOvertime || false,
                            requireCancellationApproval: (data as any).requireCancellationApproval ?? true,
                            themeConfig: (data as any).themeConfig || { primaryColor: "", secondaryColor: "" }
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
                            price: s.price ? String(s.price) : "",
                            duration: Number(s.duration) || 30,
                            imageUrl: s.imageUrl || "",
                            staffPrices: s.staffPrices ? s.staffPrices.map((sp: any) => ({
                                staffId: sp.staffId,
                                price: sp.price ? String(sp.price) : "",
                                isLinked: sp.isLinked
                            })) : []
                        })))
                    }
                } catch (error) {
                    toast.error("Erro ao carregar configurações.")
                } finally {
                    setIsLoading(false)
                }
            }
            load()
        }
    }, [status, router])

    const openConfirm = (title: string, description: string, onConfirm: () => void, variant: "default" | "destructive" = "default") => {
        setDialogConfig({ isOpen: true, title, description, onConfirm, variant })
    }

    const handleBack = () => {
        if (isDirty) openConfirm("Descartar alterações?", "Você tem modificações não salvas que serão perdidas.", () => router.back(), "destructive")
        else router.back()
    }

    const handleSave = async () => {
        const res = await updateBarbershopSettings({ barbershopId: storeData.id, storeData, hours, services, staff })
        if (res.success) { setIsDirty(false); toast.success("Configurações salvas!") }
        else toast.error(res.error)
    }


    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await uploadImageAction(formData, storeData.imageUrl)

            // Auto-Save
            const saveRes = await updateBarbershopLogo(storeData.id, res.url)

            if (saveRes.success) {
                setStoreData(prev => ({ ...prev, imageUrl: res.url }))
                toast.success("Foto atualizada!")
            } else {
                toast.error("Erro ao salvar no banco.")
            }
        } catch (error: any) {
            toast.error(error.message || "Erro no upload")
        } finally {
            setIsUploading(false)
        }
    }

    const handleServiceImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const serviceId = services[index].id
        setUploadingServiceId(serviceId)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await uploadImageAction(formData, services[index].imageUrl)
            const newServices = [...services]
            newServices[index].imageUrl = res.url
            setServices(newServices)
            setIsDirty(true)
            toast.success("Imagem do serviço atualizada!")
        } catch (error: any) {
            toast.error("Erro no upload do serviço")
        } finally {
            setUploadingServiceId(null)
        }
    }

    const handleAddAdminAsStaff = async () => {
        if (!session?.user || isAdminAlreadyStaff) return;
        const res = await addOrUpdateStaff({
            barbershopId: storeData.id,
            name: session.user.name || "",
            email: session.user.email || "",
            jobTitle: "Proprietário / Barbeiro",
            userId: (session.user as any).id
        })
        if (res.success) {
            toast.success("Você foi adicionado à equipe!");
            window.location.reload()
        }
    }

    const handleCreateNewStaff = async () => {
        if (!newStaff.email || !newStaff.name) return toast.error("Preencha os campos obrigatórios")
        setIsSubmittingStaff(true)
        const res = await addOrUpdateStaff({ ...newStaff, barbershopId: storeData.id })

        if (res.success) {
            toast.success("Funcionário cadastrado!");
            setIsNewStaffModalOpen(false);

            // Verifica se gerou credenciais
            if (res.generatedPassword) {
                setCreatedCredentials({ email: newStaff.email, password: res.generatedPassword })
            } else {
                window.location.reload()
            }
        }
        else toast.error(res.error)
        setIsSubmittingStaff(false)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copiado para a área de transferência!")
    }

    const shareCredentials = async () => {
        if (createdCredentials && navigator.share) {
            try {
                await navigator.share({
                    title: 'Suas Credenciais BarberGo',
                    text: `Olá ${newStaff.name}, aqui estão seus dados de acesso:\nLogin: ${createdCredentials.email}\nSenha: ${createdCredentials.password}\n\nPor favor, altere sua senha no primeiro acesso.`
                })
            } catch (err) {
                console.log('Error sharing', err)
            }
        } else {
            copyToClipboard(`Login: ${createdCredentials?.email}\nSenha: ${createdCredentials?.password}`)
        }
    }

    const handleDeleteStaff = async (id: string) => {
        await deleteStaff(id)
        setStaff(staff.filter(s => s.id !== id))
        toast.success("Profissional removido.")
    }

    const togglePayment = (method: string) => {
        const active = storeData.paymentMethods.includes(method)
        const next = active ? storeData.paymentMethods.filter(m => m !== method) : [...storeData.paymentMethods, method]
        setStoreData({ ...storeData, paymentMethods: next })
        setIsDirty(true)
    }

    const addCustomPayment = () => {
        if (customPayment && !storeData.paymentMethods.includes(customPayment)) {
            setStoreData({ ...storeData, paymentMethods: [...storeData.paymentMethods, customPayment] })
            setCustomPayment("")
            setIsDirty(true)
        }
    }

    const toggleAmenity = (key: string) => {
        const current = storeData.amenities || []
        const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key]
        setStoreData({ ...storeData, amenities: next })
        setIsDirty(true)
    }

    if (isLoading || status === "loading") return <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white gap-4"><Loader2 className="animate-spin text-primary" size={40} /><p>Carregando...</p></div>

    return (
        <div className="max-w-5xl mx-auto text-white">
            <ConfirmDialog
                isOpen={dialogConfig.isOpen}
                onOpenChange={(open) => setDialogConfig({ ...dialogConfig, isOpen: open })}
                title={dialogConfig.title}
                description={dialogConfig.description}
                onConfirm={dialogConfig.onConfirm}
                variant={dialogConfig.variant}
            />

            <Dialog open={isNewStaffModalOpen} onOpenChange={setIsNewStaffModalOpen}>
                <DialogContent className="bg-[#1A1B1F] border-secondary text-white max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Novo Funcionário</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1"><Label>Nome Completo</Label><Input value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} className="bg-secondary border-none" /></div>
                        <div className="space-y-1"><Label>E-mail Profissional</Label><Input value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} className="bg-secondary border-none" /></div>
                        <div className="space-y-1"><Label>Cargo</Label><Input value={newStaff.jobTitle} onChange={e => setNewStaff({ ...newStaff, jobTitle: e.target.value })} className="bg-secondary border-none" /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsNewStaffModalOpen(false)}>Cancelar</Button><Button onClick={handleCreateNewStaff} disabled={isSubmittingStaff}>{isSubmittingStaff && <Loader2 className="mr-2 animate-spin" size={16} />}Adicionar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialogo de Credenciais Geradas */}
            <Dialog open={!!createdCredentials} onOpenChange={(open) => { if (!open) { setCreatedCredentials(null); window.location.reload() } }}>
                <DialogContent className="bg-[#1A1B1F] border-secondary text-white max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-500">
                            <Check size={20} /> Conta Criada com Sucesso!
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 text-yellow-500 text-sm items-start">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <p>Uma conta foi criada automaticamente. Salve estes dados agora, a senha não será mostrada novamente.</p>
                        </div>

                        <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
                            <div>
                                <Label className="text-[10px] text-gray-500 uppercase font-bold">Login (Email)</Label>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                    <code className="text-sm font-mono">{createdCredentials?.email}</code>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(createdCredentials?.email || "")}><Copy size={12} /></Button>
                                </div>
                            </div>
                            <div className="h-px bg-white/5" />
                            <div>
                                <Label className="text-[10px] text-gray-500 uppercase font-bold">Senha Temporária</Label>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                    <code className="text-lg font-mono text-primary font-bold tracking-wider">{createdCredentials?.password}</code>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(createdCredentials?.password || "")}><Copy size={12} /></Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button className="w-full gap-2" size="lg" onClick={shareCredentials}>
                            <Share2 size={16} /> Copiar e Compartilhar
                        </Button>
                        <Button variant="ghost" className="w-full text-xs text-gray-500" onClick={() => { setCreatedCredentials(null); window.location.reload() }}>
                            Fechar e Atualizar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={handleBack}><ArrowLeft className="h-5 w-5" /></Button><h1 className="text-2xl font-bold text-white">Configurações</h1></div>
                <div className="flex items-center gap-3">
                    {isDirty && <span className="text-xs text-amber-500 font-bold animate-pulse">ALTERAÇÕES PENDENTES</span>}
                    <Button onClick={handleSave} disabled={!isDirty}>
                        <Save className="mr-2 h-4 w-4" /> Salvar Tudo
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8 bg-[#1A1B1F] p-1 h-auto">
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="hours">Horários</TabsTrigger>
                    <TabsTrigger value="services">Serviços</TabsTrigger>
                    <TabsTrigger value="staff">Equipe</TabsTrigger>
                    <TabsTrigger value="customization">Personalização</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card className="bg-[#1A1B1F] border-none text-white overflow-hidden">
                        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Store size={20} /> Unidade</CardTitle></CardHeader>
                        <CardContent className="space-y-6">

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Banner de Identidade (16:9 recomendado)</Label>
                                <div className="relative group h-[200px] w-full rounded-2xl overflow-hidden border-2 border-dashed border-secondary/50 hover:border-primary/50 transition-all bg-black/40">
                                    {storeData.imageUrl ? (
                                        <>
                                            <Image src={storeData.imageUrl} alt="Barbershop" fill className="object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Label htmlFor="banner-upload" className="cursor-pointer bg-primary p-3 rounded-full shadow-2xl active:scale-90 transition-transform">
                                                    <Camera size={24} />
                                                </Label>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
                                            <div className="p-4 bg-secondary/30 rounded-full"><ImagePlus size={32} /></div>
                                            <p className="text-xs font-bold uppercase tracking-tight">Enviar imagem da fachada ou logo</p>
                                            <Input id="banner-upload" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleBannerUpload} disabled={isUploading} />
                                        </div>
                                    )}

                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 z-10">
                                            <Loader2 size={24} className="animate-spin text-primary" />
                                            <p className="text-[10px] font-black text-primary animate-pulse tracking-widest uppercase">Enviando para o Storage...</p>
                                        </div>
                                    )}
                                    {storeData.imageUrl && !isUploading && (
                                        <input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-secondary rounded-lg bg-black/20">
                                <Label>Status da Loja</Label>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-bold ${storeData.isClosed ? 'text-red-500' : 'text-green-500'}`}>{storeData.isClosed ? 'FECHADA' : 'ABERTA'}</span>
                                    <Switch checked={!storeData.isClosed} onCheckedChange={(v) => { setStoreData({ ...storeData, isClosed: !v }); setIsDirty(true) }} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-secondary rounded-lg bg-black/20">
                                <div className="space-y-1">
                                    <Label>Aceitar Agendamentos "Extra-Horário"</Label>
                                    <p className="text-[10px] text-gray-400">Permitir que serviços terminem após o horário de fechamento.</p>
                                </div>
                                <Switch checked={storeData.allowOvertime} onCheckedChange={(v) => { setStoreData({ ...storeData, allowOvertime: v }); setIsDirty(true) }} />
                            </div>

                            <div className="flex items-center justify-between p-4 border border-secondary rounded-lg bg-black/20">
                                <div className="space-y-1">
                                    <Label>Exigir Aprovação para Cancelamento</Label>
                                    <p className="text-[10px] text-gray-400">Se desativado, o cliente poderá cancelar agendamentos futuros instantaneamente sem sua aprovação manual.</p>
                                </div>
                                <Switch checked={storeData.requireCancellationApproval} onCheckedChange={(v) => { setStoreData({ ...storeData, requireCancellationApproval: v }); setIsDirty(true) }} />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Nome</Label><Input value={storeData.name} onChange={e => { setStoreData({ ...storeData, name: e.target.value }); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                <div className="space-y-2"><Label>Endereço</Label><Input value={storeData.address} onChange={e => { setStoreData({ ...storeData, address: e.target.value }); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                            </div>

                            {/* Contatos e Redes Sociais */}
                            <div className="space-y-4 pt-4 border-t border-secondary">
                                <Label className="flex items-center gap-2"><PhoneIcon size={16} /> Contatos & Redes</Label>

                                <div className="relative">
                                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <Input
                                        value={storeData.instagram}
                                        onChange={e => { setStoreData({ ...storeData, instagram: e.target.value }); setIsDirty(true) }}
                                        className="bg-secondary border-none pl-10"
                                        placeholder="@seuinstagram"
                                    />
                                </div>

                                {storeData.phones.map((p, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <Input
                                            value={formatPhone(p.number)}
                                            onChange={e => {
                                                const n = [...storeData.phones];
                                                n[i].number = e.target.value.replace(/\D/g, "");
                                                setStoreData({ ...storeData, phones: n });
                                                setIsDirty(true)
                                            }}
                                            className="bg-secondary border-none flex-1"
                                            placeholder="(00) 00000-0000"
                                        />
                                        <Button
                                            variant={p.isWhatsapp ? "default" : "outline"}
                                            size="icon"
                                            className={p.isWhatsapp ? "bg-green-600 hover:bg-green-700 border-none" : "border-secondary text-gray-500"}
                                            onClick={() => {
                                                const n = [...storeData.phones];
                                                n[i].isWhatsapp = !n[i].isWhatsapp;
                                                setStoreData({ ...storeData, phones: n });
                                                setIsDirty(true)
                                            }}
                                            title="É WhatsApp?"
                                        >
                                            <MessageCircle size={16} />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => {
                                            setStoreData({ ...storeData, phones: storeData.phones.filter((_, idx) => idx !== i) });
                                            setIsDirty(true)
                                        }}><Trash2 size={16} /></Button>
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full border-dashed" onClick={() => {
                                    setStoreData({ ...storeData, phones: [...storeData.phones, { number: "", isWhatsapp: true }] });
                                    setIsDirty(true)
                                }}><Plus size={16} className="mr-2" /> Adicionar Telefone</Button>
                            </div>

                            {/* Comodidades */}
                            <div className="space-y-4 pt-4 border-t border-secondary">
                                <Label>Comodidades</Label>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { id: "WIFI", label: "Wi-Fi Grátis", icon: Wifi },
                                        { id: "AIR_CONDITIONING", label: "Ar Condicionado", icon: Snowflake },
                                        { id: "PARKING", label: "Estacionamento", icon: Car },
                                        { id: "TV", label: "TV", icon: Tv },
                                        { id: "COFFEE", label: "Café", icon: Coffee },
                                        { id: "BEER", label: "Cerveja", icon: Beer },
                                        { id: "BAR", label: "Bar", icon: Martini },
                                        { id: "VIDEO_GAME", label: "Video Game", icon: Gamepad2 },
                                        { id: "KIDS", label: "Atende Crianças", icon: Baby },
                                        { id: "PET_FRIENDLY", label: "Pet Friendly", icon: PawPrint },
                                        { id: "ACCESSIBILITY", label: "Acessibilidade", icon: Accessibility },
                                    ].map((item) => (
                                        <Button
                                            key={item.id}
                                            variant={storeData.amenities.includes(item.id) ? "default" : "outline"}
                                            className={`h-9 gap-2 text-xs ${!storeData.amenities.includes(item.id) && "border-secondary text-gray-400 bg-transparent"}`}
                                            onClick={() => toggleAmenity(item.id)}
                                        >
                                            <item.icon size={14} /> {item.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-secondary">
                                <Label className="flex items-center gap-2"><CreditCard size={16} /> Formas de Pagamento Aceitas</Label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {["Pix", "Dinheiro", "Visa", "Mastercard", "Elo"].map(method => {
                                        const active = storeData.paymentMethods.includes(method)
                                        return (
                                            <Button key={method} variant={active ? "default" : "outline"} size="sm" className="rounded-full h-8 text-xs" onClick={() => togglePayment(method)}>
                                                {active && <Check size={14} className="mr-1" />} {method}
                                            </Button>
                                        )
                                    })}
                                </div>
                                <div className="flex gap-2 max-w-sm">
                                    <Input placeholder="Outro (ex: PicPay)..." value={customPayment} onChange={e => setCustomPayment(e.target.value)} className="bg-secondary border-none h-9 text-xs" />
                                    <Button size="sm" onClick={addCustomPayment}>Add</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hours">
                    <Card className="bg-[#1A1B1F] border-none text-white">
                        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Clock size={20} /> Horários de Funcionamento</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {hours.map((h, i) => (
                                <div key={h.day} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b border-secondary/40 last:border-0 gap-4">
                                    <div className="flex items-center gap-4 min-w-[160px]">
                                        <Switch checked={h.isOpen} onCheckedChange={(v) => { const n = [...hours]; n[i].isOpen = v; setHours(n); setIsDirty(true) }} />
                                        <span className={`text-sm font-medium ${!h.isOpen && 'text-gray-500'}`}>{h.day}</span>
                                    </div>
                                    {h.isOpen ? (
                                        <div className="flex items-center gap-2 justify-end">
                                            <Input type="time" value={h.open} onChange={e => { const n = [...hours]; n[i].open = e.target.value; setHours(n); setIsDirty(true) }} className="w-24 bg-secondary border-none h-9 text-center" />
                                            <span className="text-xs text-gray-500 font-bold uppercase tracking-tighter">às</span>
                                            <Input type="time" value={h.close} onChange={e => { const n = [...hours]; n[i].close = e.target.value; setHours(n); setIsDirty(true) }} className="w-24 bg-secondary border-none h-9 text-center" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center h-9">
                                            <span className="text-xs text-gray-600 font-bold uppercase tracking-widest bg-black/20 px-3 py-1 rounded-md border border-white/5">Fechado</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="services" className="space-y-4">
                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => { setServices([...services, { id: Date.now().toString(), name: "", description: "", price: "0.00", duration: 30, imageUrl: "", staffPrices: [] }]); setIsDirty(true) }}>
                            <Plus size={16} className="mr-2" /> Novo Serviço
                        </Button>
                    </div>
                    {services.map((s, i) => {
                        const linkedStaffId = s.staffPrices?.find(sp => sp.isLinked)?.staffId || "none"
                        return (
                            <Card key={s.id} className="bg-[#1A1B1F] border border-secondary/40 p-4 text-white">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-secondary bg-black/20 group">
                                            {s.imageUrl ? (
                                                <>
                                                    <Image src={s.imageUrl} alt={s.name} fill className="object-cover" />
                                                    <Label htmlFor={`service-img-${i}`} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                        <Camera size={16} />
                                                    </Label>
                                                </>
                                            ) : (
                                                <Label htmlFor={`service-img-${i}`} className="absolute inset-0 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/5 transition-colors">
                                                    <ImagePlus size={20} className="text-gray-600" />
                                                    <span className="text-[8px] text-gray-500 font-bold uppercase">Foto</span>
                                                </Label>
                                            )}
                                            {uploadingServiceId === s.id && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <Loader2 size={16} className="animate-spin text-primary" />
                                                </div>
                                            )}
                                        </div>
                                        <input id={`service-img-${i}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleServiceImageUpload(i, e)} disabled={uploadingServiceId === s.id} />
                                        {s.imageUrl && (
                                            <button onClick={() => { const n = [...services]; n[i].imageUrl = ""; setServices(n); setIsDirty(true) }} className="text-[9px] text-red-500 font-bold uppercase hover:underline">Remover</button>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div><Label className="text-xs">Nome</Label><Input value={s.name} onChange={e => { const n = [...services]; n[i].name = e.target.value; setServices(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label className="text-xs">Preço</Label><Input type="number" value={s.price} onChange={e => { const n = [...services]; n[i].price = e.target.value; setServices(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                                <div><Label className="text-xs">Minutos</Label><Input type="number" value={s.duration} onChange={e => { const n = [...services]; n[i].duration = parseInt(e.target.value); setServices(n); setIsDirty(true) }} className="bg-secondary border-none" /></div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-lg border border-secondary bg-black/20">
                                            <Label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block flex items-center gap-2">
                                                <User size={12} className="text-primary" /> Vínculo de Profissional (Exclusivo)
                                            </Label>
                                            <Select
                                                value={linkedStaffId}
                                                onValueChange={(val) => {
                                                    const n = [...services]
                                                    if (val === "none") {
                                                        n[i].staffPrices = []
                                                    } else {
                                                        // Cria vinculo com o preço atual do serviço
                                                        n[i].staffPrices = [{ staffId: val, price: n[i].price, isLinked: true }]
                                                    }
                                                    setServices(n)
                                                    setIsDirty(true)
                                                }}
                                            >
                                                <SelectTrigger className="bg-transparent border-none p-0 h-auto text-sm">
                                                    <SelectValue placeholder="Selecione um profissional..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Sem vínculo (Qualquer barbeiro atende)</SelectItem>
                                                    {staff.map(m => (
                                                        <SelectItem key={m.id} value={m.id}>{m.name} {m.isActive ? '' : '(Inativo)'}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex gap-2">
                                            <Input placeholder="Descrição..." value={s.description} onChange={e => { const n = [...services]; n[i].description = e.target.value; setServices(n); setIsDirty(true) }} className="bg-secondary border-none flex-1 h-8 text-xs" />
                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => { setServices(services.filter(x => x.id !== s.id)); setIsDirty(true) }}><Trash2 size={14} /></Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </TabsContent>

                <TabsContent value="staff" className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
                        <Button variant="outline" className="border-green-600 text-green-500 bg-transparent hover:bg-green-600/10 disabled:opacity-30 disabled:border-gray-700 disabled:text-gray-700" onClick={handleAddAdminAsStaff} disabled={isAdminAlreadyStaff}>
                            {isAdminAlreadyStaff ? "Você já é Barbeiro" : "Me adicionar como Barbeiro"}
                        </Button>
                        <Button onClick={() => setIsNewStaffModalOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Novo Funcionário
                        </Button>
                    </div>
                    <div className="grid gap-4">
                        {staff.map((m, i) => (
                            <div key={m.id} className={`p-4 border rounded-xl flex flex-col md:flex-row items-center justify-between transition-all group ${!m.isActive ? 'opacity-50 grayscale bg-transparent' : 'bg-black/20 border-secondary'}`}>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-4 md:mb-0 mr-0 md:mr-6">
                                    <div className="relative"><Label className="text-[10px] text-gray-500 mb-1 block">NOME PROFISSIONAL</Label><div className="relative"><Input value={m.name} onChange={e => { const n = [...staff]; n[i].name = e.target.value; setStaff(n); setIsDirty(true) }} className="bg-[#141518] border-secondary/50 h-10 pr-8" /><Edit2 size={12} className="absolute right-3 top-3 text-gray-600 group-hover:text-primary" /></div></div>
                                    <div className="opacity-70"><Label className="text-[10px] text-gray-500 mb-1 block">E-MAIL (LOGIN)</Label><p className="text-sm truncate bg-[#141518]/50 p-2.5 rounded-lg border border-secondary/20 text-gray-400">{m.email}</p></div>
                                    <div className="relative"><Label className="text-[10px] text-gray-500 mb-1 block">CARGO / TÍTULO</Label><div className="relative"><Input value={m.jobTitle} onChange={e => { const n = [...staff]; n[i].jobTitle = e.target.value; setStaff(n); setIsDirty(true) }} className="bg-[#141518] border-secondary/50 h-10 pr-8" /><Edit2 size={12} className="absolute right-3 top-3 text-gray-600 group-hover:text-primary" /></div></div>
                                </div>
                                <div className="flex items-center gap-6 w-full md:w-auto justify-end border-t md:border-none pt-4 md:pt-0 border-secondary/30">
                                    <div className="flex flex-col items-center gap-1"><span className="text-[9px] uppercase font-bold text-gray-500">{m.isActive ? 'Ativo' : 'Inativo'}</span><Switch checked={m.isActive} onCheckedChange={async (val) => { await toggleStaffStatus(m.id, val); const n = [...staff]; n[i].isActive = val; setStaff(n); }} /></div>
                                    <Button variant="ghost" className="text-red-500 hover:bg-red-500/10 h-10 w-10 p-0" onClick={() => openConfirm("Remover Profissional?", `Remover ${m.name} permanentemente da equipe?`, async () => { await handleDeleteStaff(m.id) }, "destructive")}><Trash2 size={20} /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>


                <TabsContent value="customization" className="space-y-6">
                    <Card className="bg-[#1A1B1F] border-none text-white overflow-hidden">
                        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Palette size={20} /> Identidade Visual</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-sm text-gray-400">Estas configurações se aplicam apenas se você possuir o plano <strong>EXCLUSIVE</strong> ativado.</p>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label>Cor Primária (Destaques)</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg border border-secondary" style={{ backgroundColor: storeData.themeConfig?.primaryColor || "#815F3C" }} />
                                        <Input

                                            type="color"
                                            value={storeData.themeConfig?.primaryColor || "#815F3C"}
                                            onChange={(e) => {
                                                setStoreData({
                                                    ...storeData,
                                                    themeConfig: { ...storeData.themeConfig, primaryColor: e.target.value }
                                                })
                                                setIsDirty(true)
                                            }}
                                            className="bg-secondary border-none h-12 w-full cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Cor Secundária (Fundo)</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg border border-secondary" style={{ backgroundColor: storeData.themeConfig?.secondaryColor || "#1A1B1F" }} />
                                        <Input

                                            type="color"
                                            value={storeData.themeConfig?.secondaryColor || "#1A1B1F"}
                                            onChange={(e) => {
                                                setStoreData({
                                                    ...storeData,
                                                    themeConfig: { ...storeData.themeConfig, secondaryColor: e.target.value }
                                                })
                                                setIsDirty(true)
                                            }}
                                            className="bg-secondary border-none h-12 w-full cursor-pointer "
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    )
}
