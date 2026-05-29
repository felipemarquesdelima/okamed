import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardCharts from "./DashboardCharts";
import MonthlyTable from "./MonthlyTable";
import { MonthlyData } from "@/lib/mockData";
import okamedLogo from "@/assets/okamed-logo.jpeg";
import type { DateRange } from "@/lib/dateFilter";

interface DashboardTabsProps {
  data: MonthlyData[];
  hospitalId: string;
  selectedYear: number;
  selectedServices: string[];
  selectedMonthNumber: number;
  dateRange: DateRange;
}

const tabItems = [
  { value: "servicos", label: "Serviços" },
  { value: "disponibilidade", label: "Disponibilidade" },
  { value: "causas", label: "Causas" },
  { value: "setores", label: "Setores" },
  { value: "tempo", label: "Tempo" },
  { value: "treinamento", label: "Treinamento" },
  { value: "registros", label: "Registros" },
  { value: "processos", label: "Processos" },
];

const DashboardTabs = ({ data, hospitalId, selectedYear, selectedServices, selectedMonthNumber }: DashboardTabsProps) => {
  return (
    <Tabs defaultValue="servicos" className="w-full">

      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <img src={okamedLogo} alt="OKAMED" className="h-8 w-auto object-contain" />
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs px-4 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="servicos" className="mt-4 space-y-4">
        <DashboardCharts selectedYear={selectedYear} selectedServices={selectedServices} hospitalId={hospitalId} selectedMonthNumber={selectedMonthNumber} />
        <MonthlyTable data={data} />
      </TabsContent>

      {tabItems.slice(1).map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          <div className="bg-card rounded-xl p-8 stat-card-shadow text-center">
            <p className="text-muted-foreground">Conteúdo de {tab.label} em desenvolvimento.</p>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default DashboardTabs;
