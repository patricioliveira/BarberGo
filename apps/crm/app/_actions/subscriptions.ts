"use server"

import { db } from "@barbergo/database"
import { revalidatePath } from "next/cache"
import { PLANS, PlanType, BillingCycle } from "@barbergo/shared"

// 0. Trocar de Plano
export const switchPlan = async (
    subscriptionId: string,
    newPlan: PlanType,
    newCycle: BillingCycle,
    billingType: "PREPAID" | "POSTPAID" = "POSTPAID",
    paymentMethod?: string,
    paidAmount?: number
) => {
    const planDetails = PLANS[newPlan]
    if (!planDetails) throw new Error("Plano inválido")

    const newPrice = planDetails.prices[newCycle]

    // Determine Status and EndDate
    let newStatus: "ACTIVE" | undefined = undefined
    let newEndDate = undefined;

    if (paymentMethod && paidAmount) {
        newStatus = "ACTIVE"
        const now = new Date()
        if (newCycle === BillingCycle.MONTHLY) {
            newEndDate = new Date(now.setDate(now.getDate() + 30))
        } else if (newCycle === BillingCycle.SEMIANNUALLY) {
            newEndDate = new Date(now.setMonth(now.getMonth() + 6))
        } else if (newCycle === BillingCycle.ANNUALLY) {
            newEndDate = new Date(now.setFullYear(now.getFullYear() + 1))
        }
    }

    // Transactions
    const operations: any[] = []

    // 1. Update Subscription
    operations.push(db.subscription.update({
        where: { id: subscriptionId },
        data: {
            plan: newPlan,
            billingCycle: newCycle,
            billingType: billingType,
            price: newPrice,
            ...(newStatus && { status: newStatus }),
            ...(newEndDate && { endDate: newEndDate }),
            barbershop: {
                update: {
                    isExclusive: newPlan === PlanType.EXCLUSIVE
                }
            }
        },
        include: { barbershop: true }
    }))

    // 2. Generate Invoice if Paid
    if (paymentMethod && paidAmount) {
        let refText = `Upgrade/Mudança para ${planDetails.name} (${newCycle === BillingCycle.MONTHLY ? 'Mensal' : newCycle === BillingCycle.SEMIANNUALLY ? 'Semestral' : 'Anual'})`

        operations.push(db.invoice.create({
            data: {
                subscriptionId,
                amount: paidAmount,
                method: paymentMethod,
                paidAt: new Date(),
                dueDate: new Date(),
                status: "PAID",
                reference: refText
            }
        }))
    }

    const [sub] = await db.$transaction(operations)

    if (sub.barbershop.ownerId) {
        await db.notification.create({
            data: {
                recipientId: sub.barbershop.ownerId,
                title: "Plano Alterado",
                message: `Seu plano foi alterado para ${planDetails.name} (${newCycle === BillingCycle.MONTHLY ? 'Mensal' : newCycle === BillingCycle.SEMIANNUALLY ? 'Semestral' : 'Anual'}) pela equipe de suporte.`,
                type: "FINANCE_ALERT",
                read: false
            }
        })
    }

    revalidatePath("/")
    return { success: true }
}


// 1. Confirmar Pagamento e Ativar
export const confirmPaymentAndActivate = async (subscriptionId: string, amount: number, method: string, redeemReward: boolean = false) => {
    const sub = await db.subscription.findUnique({
        where: { id: subscriptionId },
        include: { barbershop: true }
    })
    if (!sub) throw new Error("Assinatura não encontrada")

    let discount = 0;
    let rewardSourceId = null;

    if (redeemReward) {
        // Encontrar uma recompensa válida
        const rewardSource = await db.barbershop.findFirst({
            where: {
                referredByBarbershopId: sub.barbershopId,
                referralRewardClaimed: false,
                subscription: { status: "ACTIVE" }
            }
        })

        if (!rewardSource) {
            throw new Error("Não há recompensas disponíveis para resgate.")
        }

        // Marcar como usado
        await db.barbershop.update({
            where: { id: rewardSource.id },
            data: { referralRewardClaimed: true }
        })

        // Calcular desconto (Assumindo que o desconto é 50% do valor padrão ou a diferença do que foi pago)
        // O valor `amount` já vem descontado do front? Sim.
        // O `discount` armazenado será simbólico ou calculado?
        // Vamos salvar o desconto como 50% do valor do plano original
        // Ou melhor: invoice.amount + discount = Subtotal
        // Se user pagou 25 (e era 50), discount é 25.

        discount = Number(sub.price) - amount;
        if (discount < 0) discount = 0;

        rewardSourceId = rewardSource.id;
    }

    // Calcula novo vencimento com base no ciclo
    const nextBilling = new Date()

    if (sub.billingCycle === BillingCycle.SEMIANNUALLY) {
        nextBilling.setMonth(nextBilling.getMonth() + 6)
    } else if (sub.billingCycle === BillingCycle.ANNUALLY) {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1)
    } else {
        nextBilling.setDate(nextBilling.getDate() + 30)
    }

    // Descrição da Fatura
    let refText = `Mensalidade ref. ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
    if (sub.billingCycle === BillingCycle.SEMIANNUALLY) {
        refText = `Assinatura Semestral (Início ${new Date().toLocaleDateString('pt-BR')})`
    } else if (sub.billingCycle === BillingCycle.ANNUALLY) {
        refText = `Assinatura Anual (Início ${new Date().toLocaleDateString('pt-BR')})`
    }


    const invoice = await db.invoice.create({
        data: {
            subscriptionId,
            amount,
            discount,
            referralRewardSourceId: rewardSourceId,
            method,
            paidAt: new Date(),
            dueDate: new Date(),
            status: "PAID",
            reference: refText
        }
    })

    // --- LÓGICA DE COMISSÃO DE PARCEIRO ---
    // Regra: Calcular sobre valor CHEIO mensal, independente do ciclo ou descontos do cliente.
    if (sub.barbershop.referredById) {
        const partner = await db.user.findUnique({
            where: { id: sub.barbershop.referredById }
        })

        if (partner && partner.role === "PARTNER" && Number(partner.commissionPercentage) > 0) {
            const planFullPrice = PLANS[sub.plan].price // Valor cheio mensal
            const commissionAmount = percent(Number(planFullPrice), Number(partner.commissionPercentage))

            // Definir quantos meses de comissão gerar
            const payoutsCount = sub.billingCycle === BillingCycle.ANNUALLY ? 12 :
                sub.billingCycle === BillingCycle.SEMIANNUALLY ? 6 : 1

            const commissionsData = []

            for (let i = 0; i < payoutsCount; i++) {
                const payoutDate = new Date()
                payoutDate.setMonth(payoutDate.getMonth() + i)

                commissionsData.push({
                    partnerId: partner.id,
                    invoiceId: invoice.id,
                    amount: commissionAmount,
                    dueDate: payoutDate,
                    status: "PENDING", // Sempre PENDING, pagamento real é outra etapa/fluxo
                    referenceMonth: payoutDate
                })
            }

            // Criar registros de comissão
            if (commissionsData.length > 0) {
                await db.commissionPayout.createMany({
                    data: commissionsData as any
                })
            }
        }
    }

    // Atualiza assinatura separadamente (já que Invoice precisa ser criado antes para amarrar comissão)
    await db.subscription.update({
        where: { id: subscriptionId },
        data: {
            status: "ACTIVE",
            endDate: nextBilling
        }
    })

    revalidatePath("/barbershop/[id]")
}

// Helper de porcentagem
function percent(total: number, p: number) {
    return (total * p) / 100
}

// 2. Marcar Inadimplência
export const markAsPastDue = async (subscriptionId: string) => {
    await db.subscription.update({
        where: { id: subscriptionId },
        data: { status: "PAST_DUE" }
    })
    revalidatePath("/")
}

// 3. Bloquear Acesso e Cancelar Comissões Futuras
export const suspendAccess = async (subscriptionId: string) => {
    await db.subscription.update({
        where: { id: subscriptionId },
        data: { status: "SUSPENDED" }
    })

    // Cancelar comissões futuras pendentes desta assinatura
    await cancelFutureCommissions(subscriptionId)

    revalidatePath("/")
}

// Helper: Cancelar comissões futuras
export const cancelFutureCommissions = async (subscriptionId: string) => {
    // Busca invoices da subscription para encontrar commissions vinculadas
    const invoices = await db.invoice.findMany({
        where: { subscriptionId },
        select: { id: true }
    })

    const invoiceIds = invoices.map(i => i.id)

    if (invoiceIds.length > 0) {
        await db.commissionPayout.updateMany({
            where: {
                invoiceId: { in: invoiceIds },
                status: "PENDING",
                dueDate: { gt: new Date() } // Apenas futuras
            },
            data: {
                status: "CANCELED"
            }
        })
    }
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

// 5. Update Due Date
export const updateSubscriptionDueDate = async (subscriptionId: string, newDate: Date) => {
    await db.subscription.update({
        where: { id: subscriptionId },
        data: {
            endDate: newDate
        }
    })

    revalidatePath("/admin/billing")
    revalidatePath(`/barbershop/${subscriptionId}`)
}