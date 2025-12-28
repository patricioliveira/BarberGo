export enum PlanType {
  BASIC = 'BASIC',
  INTERMEDIUM = 'INTERMEDIUM',
  PRO = 'PRO',
  EXCLUSIVE = 'EXCLUSIVE',
}

export const PLANS = {
  [PlanType.BASIC]: {
    id: PlanType.BASIC,
    name: 'Basic',
    price: 49.90,
    maxProfessionals: 1,
    description: '1 profissional',
    features: ['1 profissional'],
  },
  [PlanType.INTERMEDIUM]: {
    id: PlanType.INTERMEDIUM,
    name: 'Intermedium',
    price: 79.90,
    maxProfessionals: 5,
    description: '2 a 5 profissionais',
    features: ['2 a 5 profissionais'],
  },
  [PlanType.PRO]: {
    id: PlanType.PRO,
    name: 'Pro',
    price: 109.90,
    maxProfessionals: 15,
    description: '6 a 15 profissionais',
    features: ['6 a 15 profissionais'],
  },
  [PlanType.EXCLUSIVE]: {
    id: PlanType.EXCLUSIVE,
    name: 'Exclusive',
    price: 139.90,
    maxProfessionals: Infinity,
    description: 'Sem limites de profissionais',
    features: ['Sem limites de profissionais', 'Todas as funcionalidades'],
  },
};
