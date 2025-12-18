"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription, Tabs, TabsContent, TabsList, TabsTrigger } from "@barbergo/ui"
import { Save, ArrowLeft, Plus, Trash2, Clock, Phone, Store, MapPin, Power } from "lucide-react"

// --- COMPONENTE SWITCH CUSTOMIZADO (já que não está no @barbergo/ui) ---
const Switch = ({ checked, onCheckedChange, disabled }: { checked: boolean; onCheckedChange: (c: boolean) => void, disabled?: boolean }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-secondary'}`}
    >
        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
)

// Tipos
type StaffMember = { id: string; name: string; role: string }
type WorkingHour = { day: string; open: string; close: string; isOpen: boolean }

export default function SettingsPage() {
    const router = useRouter()
    const [isDirty, setIsDirty] = useState(false)
    const [activeTab, setActiveTab] = useState("general")

    // --- ESTADOS DO FORMULÁRIO ---

    // Geral
    const [storeName, setStoreName] = useState("BarberGo Hall")
    const [storePhone, setStorePhone] = useState("(11) 99999-9999")
    const [storeAddress, setStoreAddress] = useState("Rua Exemplo, 123 - Centro") // Campo adicionado
    const [isShopClosed, setIsShopClosed] = useState(false)

    // Horários
    const [hours, setHours] = useState<WorkingHour[]>([
        { day: "Segunda", open: "09:00", close: "18:00", isOpen: true },
        { day: "Terça", open: "09:00", close: "18:00", isOpen: true },
        { day: "Quarta", open: "09:00", close: "18:00", isOpen: true },
        { day: "Quinta", open: "09:00", close: "18:00", isOpen: true },
        { day: "Sexta", open: "09:00", close: "18:00", isOpen: true },
        { day: "Sábado", open: "09:00", close: "14:00", isOpen: true },
        { day: "Domingo", open: "00:00", close: "00:00", isOpen: false },
    ])

    // Equipe
    const [staff, setStaff] = useState<StaffMember[]>([
        { id: "1", name: "Patrício Oliveira", role: "Barbeiro Master" }
    ])
    const [newStaffName, setNewStaffName] = useState("")

    // --- HANDLERS ---

    const markAsDirty = () => setIsDirty(true)

    const handleBack = () => {
        if (isDirty) {
            const confirmLeave = window.confirm("Você tem alterações não salvas. Deseja sair mesmo assim?")
            if (!confirmLeave) return
        }
        router.back()
    }

    const handleSave = () => {
        console.log("Salvando dados...", { storeName, storePhone, storeAddress, isShopClosed, hours, staff })
        setIsDirty(false)
        alert("Configurações salvas com sucesso!")
    }

    const handleAddStaff = () => {
        if (!newStaffName.trim()) return
        setStaff([...staff, { id: Date.now().toString(), name: newStaffName, role: "Barbeiro" }])
        setNewStaffName("")
        markAsDirty()
    }

    const handleRemoveStaff = (id: string) => {
        if (confirm("Remover este membro da equipe?")) {
            setStaff(staff.filter(s => s.id !== id))
            markAsDirty()
        }
    }

    const handleHourChange = (index: number, field: keyof WorkingHour, value: any) => {
        const newHours = [...hours]
        // @ts-ignore
        newHours[index][field] = value
        setHours(newHours)
        markAsDirty()
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl">

            {/* HEADER DA PÁGINA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Configurações</h1>
                </div>

                <div className="flex items-center gap-2">
                    {isDirty && <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Não salvo</span>}
                    <Button onClick={handleSave} disabled={!isDirty}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="hours">Horários</TabsTrigger>
                    <TabsTrigger value="staff">Equipe</TabsTrigger>
                </TabsList>

                {/* TAB 1: GERAL */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações da Loja</CardTitle>
                            <CardDescription>Gerencie o status e contatos da sua barbearia.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Fechar Loja (Com Switch) */}
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Power className={`h-4 w-4 ${isShopClosed ? "text-red-500" : "text-green-500"}`} />
                                        <Label className="text-base">Status da Loja</Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {isShopClosed ? "Sua loja está fechada para novos agendamentos." : "Sua loja está aberta recebendo clientes."}
                                    </p>
                                </div>
                                <Switch
                                    checked={isShopClosed}
                                    onCheckedChange={(val) => { setIsShopClosed(val); markAsDirty() }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da Barbearia</Label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="name"
                                        value={storeName}
                                        onChange={(e) => { setStoreName(e.target.value); markAsDirty() }}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="phone"
                                        value={storePhone}
                                        onChange={(e) => { setStorePhone(e.target.value); markAsDirty() }}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="address"
                                        value={storeAddress}
                                        onChange={(e) => { setStoreAddress(e.target.value); markAsDirty() }}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: HORÁRIOS */}
                <TabsContent value="hours">
                    <Card>
                        <CardHeader>
                            <CardTitle>Horário de Funcionamento</CardTitle>
                            <CardDescription>Defina os horários de abertura e fechamento.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {hours.map((item, index) => (
                                <div key={item.day} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b last:border-0 gap-3">
                                    <div className="flex items-center gap-4 min-w-[150px]">
                                        {/* Switch usado aqui */}
                                        <Switch
                                            checked={item.isOpen}
                                            onCheckedChange={(val) => handleHourChange(index, "isOpen", val)}
                                        />
                                        <span className={`font-medium ${!item.isOpen && "text-muted-foreground line-through"}`}>
                                            {item.day}
                                        </span>
                                    </div>

                                    {item.isOpen && (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                            <div className="relative">
                                                <Clock className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
                                                <Input
                                                    type="time"
                                                    value={item.open}
                                                    onChange={(e) => handleHourChange(index, "open", e.target.value)}
                                                    className="w-28 pl-7 h-8"
                                                />
                                            </div>
                                            <span className="text-sm text-gray-500">até</span>
                                            <div className="relative">
                                                <Clock className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
                                                <Input
                                                    type="time"
                                                    value={item.close}
                                                    onChange={(e) => handleHourChange(index, "close", e.target.value)}
                                                    className="w-28 pl-7 h-8"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {!item.isOpen && <span className="text-sm text-muted-foreground italic">Fechado</span>}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: EQUIPE */}
                <TabsContent value="staff">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestão da Equipe</CardTitle>
                            <CardDescription>Adicione ou remova barbeiros.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nome do novo profissional"
                                    value={newStaffName}
                                    onChange={(e) => setNewStaffName(e.target.value)}
                                />
                                <Button onClick={handleAddStaff}>
                                    <Plus className="mr-2 h-4 w-4" /> Adicionar
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {staff.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">
                                                {member.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{member.name}</p>
                                                <p className="text-xs text-muted-foreground">{member.role}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleRemoveStaff(member.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {staff.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Nenhum membro na equipe.
                                    </div>
                                )}
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}