"use client"

import { useState } from "react"
import { Button, Badge } from "@barbergo/ui"
import { Power, Trash2 } from "lucide-react"
import { togglePartnerStatus, deletePartner } from "../_actions/partners"
import { toast } from "sonner"
import { ConfirmDialog } from "./confirm-dialog"

export function PartnersTable({ partners }: { partners: any[] }) {
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        partnerId: string;
        action: 'toggle' | 'delete';
        status?: boolean;
        name: string;
    }>({ isOpen: false, partnerId: '', action: 'toggle', name: '' });

    const handleAction = async () => {
        try {
            if (confirmConfig.action === 'toggle') {
                await togglePartnerStatus(confirmConfig.partnerId, confirmConfig.status!);
                toast.success(`Parceiro ${confirmConfig.status ? 'inativado' : 'ativado'}!`);
            } else {
                await deletePartner(confirmConfig.partnerId);
                toast.success("Parceiro removido com sucesso.");
            }
        } catch (error) {
            toast.error("Erro ao realizar operação.");
        }
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-black/40 text-[10px] uppercase font-black text-gray-500">
                    <tr>
                        <th className="p-6">Parceiro</th>
                        <th className="p-6">Comissão (%)</th>
                        <th className="p-6">Indicações (Ativas/Total)</th>
                        <th className="p-6">Total a Pagar</th>
                        <th className="p-6 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {partners.map(partner => {
                        const totalReferrals = partner.referredBarbershops.length
                        const activeReferrals = partner.referredBarbershops.filter((s: any) => s.subscription?.status === 'ACTIVE').length
                        const revenue = partner.referredBarbershops
                            .filter((s: any) => s.subscription?.status === 'ACTIVE')
                            .reduce((sum: number, s: any) => sum + Number(s.subscription?.price || 0), 0)
                        const commission = (revenue * Number(partner.commissionPercentage)) / 100

                        return (
                            <tr key={partner.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                                <td className="p-6">
                                    <p className="font-bold flex items-center gap-2">
                                        {partner.name}
                                        {!partner.isActive && <Badge variant="destructive" className="text-[8px] h-4">INATIVO</Badge>}
                                    </p>
                                    <p className="text-[10px] text-gray-500 uppercase">{partner.email}</p>
                                </td>
                                <td className="p-6 font-mono font-bold text-amber-500">{Number(partner.commissionPercentage)}%</td>
                                <td className="p-6 text-gray-400 font-bold">{activeReferrals} / {totalReferrals}</td>
                                <td className="p-6 font-mono font-bold text-green-500">R$ {commission.toFixed(2)}</td>
                                <td className="p-6 text-right space-x-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={partner.isActive ? "text-green-500 hover:text-green-400" : "text-red-500 hover:text-red-400"}
                                        onClick={() => setConfirmConfig({
                                            isOpen: true,
                                            partnerId: partner.id,
                                            action: 'toggle',
                                            status: partner.isActive,
                                            name: partner.name
                                        })}
                                    >
                                        <Power size={18} />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-red-500 hover:bg-red-500/10"
                                        onClick={() => setConfirmConfig({
                                            isOpen: true,
                                            partnerId: partner.id,
                                            action: 'delete',
                                            name: partner.name
                                        })}
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onOpenChange={(open: any) => setConfirmConfig(prev => ({ ...prev, isOpen: open }))}
                onConfirm={handleAction}
                title={confirmConfig.action === 'delete' ? "Remover Parceiro" : "Alterar Status"}
                description={`Tem certeza que deseja ${confirmConfig.action === 'delete' ? 'EXCLUIR permanentemente' : (confirmConfig.status ? 'INATIVAR' : 'ATIVAR')} o parceiro ${confirmConfig.name}?`}
                variant={confirmConfig.action === 'delete' ? 'destructive' : 'default'}
                confirmText={confirmConfig.action === 'delete' ? 'Excluir Agora' : 'Confirmar Alteração'}
            />
        </div>
    )
}