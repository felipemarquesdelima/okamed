import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { serviceTypes } from "@/lib/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Building2, Wrench, Calendar as CalendarIcon, Settings, Zap, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { DateRange } from "@/lib/dateFilter";
import { isRangeActive } from "@/lib/dateFilter";

interface FilterBarProps {
  selectedHospital: string;
  onHospitalChange: (id: string) => void;
  selectedServices: string[];
  onServiceToggle: (id: string) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (r: DateRange) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  wrench: <Wrench className="h-3.5 w-3.5" />,
  calendar: <Calendar className="h-3.5 w-3.5" />,
  settings: <Settings className="h-3.5 w-3.5" />,
  zap: <Zap className="h-3.5 w-3.5" />,
};

const months = [
  "Todos os meses", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const FilterBar = ({
  selectedHospital, onHospitalChange,
  selectedServices, onServiceToggle,
  selectedYear, onYearChange,
  selectedMonth, onMonthChange,
}: FilterBarProps) => {
  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hospitals").select("*").eq("active", true).order("short_name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="bg-card rounded-xl p-4 md:p-6 stat-card-shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Hospital Select */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Unidade Hospitalar</label>
          <Select value={selectedHospital} onValueChange={onHospitalChange}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Selecione o hospital" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Geral (Todos os Hospitais)
                </div>
              </SelectItem>
              {hospitals.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {h.name} ({h.short_name})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Service Type */}
        <div className="lg:col-span-2">
          <label className="text-sm font-semibold text-foreground mb-2 block">Tipo de Serviço</label>
          <div className="flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-hide">
            {serviceTypes.map((st) => (
              <Badge
                key={st.id}
                variant={selectedServices.includes(st.id) ? "default" : "outline"}
                className={`cursor-pointer transition-all whitespace-nowrap text-[11px] leading-none py-1 px-2 ${
                  selectedServices.includes(st.id)
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-muted"
                }`}
                onClick={() => onServiceToggle(st.id)}
              >
                {iconMap[st.icon]}
                <span className="ml-1">{st.label}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Year and Month */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm font-semibold text-foreground mb-2 block">Ano</label>
            <Select value={String(selectedYear)} onValueChange={(v) => onYearChange(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-semibold text-foreground mb-2 block">Mês</label>
            <Select value={selectedMonth} onValueChange={onMonthChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
