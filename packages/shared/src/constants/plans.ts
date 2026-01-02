export enum PlanType {
  BASIC = 'BASIC',
  INTERMEDIUM = 'INTERMEDIUM',
  PRO = 'PRO',
  EXCLUSIVE = 'EXCLUSIVE',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  SEMIANNUALLY = 'SEMIANNUALLY',
  ANNUALLY = 'ANNUALLY',
}

export const PLANS = {
  [PlanType.BASIC]: {
    id: PlanType.BASIC,
    name: 'Basic',
    price: 49.9,
    prices: {
      [BillingCycle.MONTHLY]: 49.9,
      [BillingCycle.SEMIANNUALLY]: 263.47, // 12% OFF
      [BillingCycle.ANNUALLY]: 467.06,     // 22% OFF
    },
    maxProfessionals: 1,
    description: '1 profissional',
    features: ['1 profissional'],
  },

  [PlanType.INTERMEDIUM]: {
    id: PlanType.INTERMEDIUM,
    name: 'Intermedium',
    price: 79.9,
    prices: {
      [BillingCycle.MONTHLY]: 79.9,
      [BillingCycle.SEMIANNUALLY]: 421.87,
      [BillingCycle.ANNUALLY]: 747.86,
    },
    maxProfessionals: 5,
    description: '2 a 5 profissionais',
    features: ['2 a 5 profissionais'],
  },

  [PlanType.PRO]: {
    id: PlanType.PRO,
    name: 'Pro',
    price: 109.9,
    prices: {
      [BillingCycle.MONTHLY]: 109.9,
      [BillingCycle.SEMIANNUALLY]: 580.27,
      [BillingCycle.ANNUALLY]: 1028.66,
    },
    maxProfessionals: 15,
    description: '6 a 15 profissionais',
    features: ['6 a 15 profissionais'],
  },

  [PlanType.EXCLUSIVE]: {
    id: PlanType.EXCLUSIVE,
    name: 'Exclusive',
    price: 139.9,
    prices: {
      [BillingCycle.MONTHLY]: 139.9,
      [BillingCycle.SEMIANNUALLY]: 738.67,
      [BillingCycle.ANNUALLY]: 1309.46,
    },
    maxProfessionals: Infinity,
    description: 'Sem limite de profissionais',
    features: ['Sem limites', 'Todas as funcionalidades'],
  },
};
