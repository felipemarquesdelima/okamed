export interface Hospital {
  id: string;
  name: string;
  shortName: string;
}

export const hospitals: Hospital[] = [
  { id: "hc", name: "Hospital de Clínicas", shortName: "HC" },
  { id: "hm", name: "Hospital Municipal", shortName: "HM" },
  { id: "ha", name: "Hospital de Atendimento", shortName: "HA" },
  { id: "hu", name: "Hospital Universitário", shortName: "HU" },
  { id: "rede", name: "Rede de Saúde", shortName: "REDE" },
];

export interface ServiceType {
  id: string;
  label: string;
  icon: string;
}

export const serviceTypes: ServiceType[] = [
  { id: "corretiva", label: "Manutenção Corretiva", icon: "wrench" },
  { id: "preventiva", label: "Manutenção Preventiva", icon: "calendar" },
  { id: "calibracao", label: "Calibração", icon: "settings" },
  { id: "eletrica", label: "Teste de Segurança Elétrica", icon: "zap" },
];

export interface MonthlyData {
  month: string;
  osAbertas: number;
  osFinalizadas: number;
  percentual: number;
  meta: number;
  acumCritico: number;
  acumGeral: number;
  analiseCritica: string;
  serviceDetails?: MonthlyServiceDetail[];
}

export interface ActionPlan5W2H {
  achievedPercent: number;
  goalPercent: number;
  status: string;
  whatAction: string;
  whyAction: string;
  whereAction: string;
  dueDate: string;
  responsible: string;
  howAction: string;
  estimatedCost: number | null;
}

export interface MonthlyServiceDetail {
  serviceOrderId: string;
  serviceType: string;
  analiseCritica: string;
  actionPlan?: ActionPlan5W2H;
}

export function getMonthlyData(hospitalId: string): MonthlyData[] {
  const dataMap: Record<string, MonthlyData[]> = {
    hc: [
      { month: "Jan", osAbertas: 417, osFinalizadas: 381, percentual: 91.4, meta: 90, acumCritico: 2, acumGeral: 27, analiseCritica: "Análise do mês de janeiro com 417 ordens abertas e 36 pendentes." },
      { month: "Fev", osAbertas: 462, osFinalizadas: 433, percentual: 93.7, meta: 90, acumCritico: 2, acumGeral: 29, analiseCritica: "No mês de Fevereiro foram atendidas 475 ordens referentes a manutenções corretivas." },
      { month: "Mar", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Abr", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Mai", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Jun", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Jul", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Ago", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Set", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Out", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Nov", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Dez", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
    ],
    hm: [
      { month: "Jan", osAbertas: 312, osFinalizadas: 290, percentual: 92.9, meta: 90, acumCritico: 1, acumGeral: 15, analiseCritica: "Análise do mês de janeiro com bom desempenho." },
      { month: "Fev", osAbertas: 345, osFinalizadas: 320, percentual: 92.8, meta: 90, acumCritico: 1, acumGeral: 18, analiseCritica: "Fevereiro com resultados dentro da meta." },
      { month: "Mar", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Abr", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Mai", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Jun", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Jul", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Ago", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Set", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Out", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Nov", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
      { month: "Dez", osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" },
    ],
    ha: [
      { month: "Jan", osAbertas: 250, osFinalizadas: 230, percentual: 92.0, meta: 90, acumCritico: 1, acumGeral: 12, analiseCritica: "Mês dentro da meta estabelecida." },
      { month: "Fev", osAbertas: 280, osFinalizadas: 265, percentual: 94.6, meta: 90, acumCritico: 0, acumGeral: 10, analiseCritica: "Excelente desempenho em fevereiro." },
      ...Array.from({ length: 10 }, (_, i) => ({ month: ["Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i], osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" })),
    ],
    hu: [
      { month: "Jan", osAbertas: 180, osFinalizadas: 165, percentual: 91.7, meta: 90, acumCritico: 1, acumGeral: 8, analiseCritica: "Janeiro com desempenho satisfatório." },
      { month: "Fev", osAbertas: 195, osFinalizadas: 182, percentual: 93.3, meta: 90, acumCritico: 0, acumGeral: 7, analiseCritica: "Resultados acima da meta." },
      ...Array.from({ length: 10 }, (_, i) => ({ month: ["Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i], osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" })),
    ],
    rede: [
      { month: "Jan", osAbertas: 520, osFinalizadas: 480, percentual: 92.3, meta: 90, acumCritico: 3, acumGeral: 30, analiseCritica: "Rede operando dentro dos parâmetros." },
      { month: "Fev", osAbertas: 550, osFinalizadas: 510, percentual: 92.7, meta: 90, acumCritico: 2, acumGeral: 28, analiseCritica: "Desempenho estável na rede." },
      ...Array.from({ length: 10 }, (_, i) => ({ month: ["Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i], osAbertas: 0, osFinalizadas: 0, percentual: 0, meta: 90, acumCritico: 0, acumGeral: 0, analiseCritica: "—" })),
    ],
  };
  return dataMap[hospitalId] || dataMap.hc;
}

export function getStats(hospitalId: string) {
  const data = getMonthlyData(hospitalId);
  const activeMonths = data.filter(d => d.osAbertas > 0);
  const totalAbertas = activeMonths.reduce((s, d) => s + d.osAbertas, 0);
  const totalFinalizadas = activeMonths.reduce((s, d) => s + d.osFinalizadas, 0);
  const taxaConclusao = totalAbertas > 0 ? ((totalFinalizadas / totalAbertas) * 100) : 0;
  const acumCritico = activeMonths.reduce((s, d) => s + d.acumCritico, 0);
  return { totalAbertas, totalFinalizadas, taxaConclusao: Math.round(taxaConclusao * 10) / 10, acumCritico };
}
