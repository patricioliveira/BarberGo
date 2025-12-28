"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"
import { PLANS, PlanType } from "@barbergo/shared"

// 0. Trocar de Plano
export const switchPlan = async (subscriptionId: string, newPlan: PlanType) => {
    const planDetails = PLANS[newPlan]
    if (!planDetails) throw new Error("Plano inválido")

    // Atualiza Assinatura E Barbearia (Exclusive precisa ser atualizado)
    const sub = await db.subscription.update({
        where: { id: subscriptionId },
        data: {
            plan: newPlan,
            price: planDetails.price,
            barbershop: {
                update: {
                    isExclusive: newPlan === PlanType.EXCLUSIVE
                }
            }
        },
        include: {
            barbershop: true
        }
    })

    if (sub.barbershop.ownerId) {
        await db.notification.create({
            data: {
                recipientId: sub.barbershop.ownerId,
                title: "Plano Alterado",
                message: `Seu plano foi alterado para ${planDetails.name} pela equipe de suporte.`,
                type: "FINANCE_ALERT",
                read: false
            }
        })
    }

    revalidatePath("/")
    return { success: true }
}


// 1. Confirmar Pagamento e Ativar
export const confirmPaymentAndActivate = async (subscriptionId: string, amount: number, method: string) => {
    const sub = await db.subscription.findUnique({ where: { id: subscriptionId } })
    if (!sub) throw new Error("Assinatura não encontrada")

    // Calcula novo vencimento (30 dias a partir de hoje)
    const nextBilling = new Date()
    nextBilling.setDate(nextBilling.getDate() + 30)

    await db.$transaction([
        // Atualiza a assinatura
        db.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: "ACTIVE",
                endDate: nextBilling
            }
        }),
        // Cria o registro no histórico (Faturamento)
        db.invoice.create({
            data: {
                subscriptionId,
                amount,
                method,
                paidAt: new Date(),
                dueDate: new Date(),
                status: "PAID",
                reference: `Mensalidade ref. ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
            }
        })
    ])

    revalidatePath("/barbershop/[id]")
}

// 2. Marcar Inadimplência
export const markAsPastDue = async (subscriptionId: string) => {
    await db.subscription.update({
        where: { id: subscriptionId },
        data: { status: "PAST_DUE" }
    })
    revalidatePath("/")
}

// 3. Bloquear Acesso
export const suspendAccess = async (subscriptionId: string) => {
    await db.subscription.update({
        where: { id: subscriptionId },
        data: { status: "SUSPENDED" }
    })
    revalidatePath("/")
}

// 4. Gerar Faturamento Manual (Apenas Registro)
export const createManualInvoice = async (data: {
    subscriptionId: string,
    amount: number,
    dueDate: Date,
    reference: string
}) => {
    await db.invoice.create({
        data: {
            subscriptionId: data.subscriptionId,
            amount: data.amount,
            dueDate: data.dueDate,
            reference: data.reference,
            status: "PENDING"
        }
    })
    revalidatePath("/")
}