import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { serviceTypes } from "@/lib/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  dateRange: DateRange;
  onDateRangeChange: (r: DateRange) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  wrench: <Wrench className="h-3.5 w-3.5" />,
  calendar: <CalendarIcon className="h-3.5 w-3.5" />,
  settings: <Settings className="h-3.5 w-3.5" />,
  zap: <Zap className="h-3.5 w-3.5" />,
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const YEARS = [2024, 2025, 2026];

const FilterBar = ({
  selectedHospital, onHospitalChange,
  selectedServices, onServiceToggle,
  dateRange, onDateRangeChange,
}: FilterBarProps) => {
  const rangeActive = isRangeActive(dateRange);
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [monthYear, setMonthYear] = useState<number>(
    dateRange.from?.getFullYear() ?? today.getFullYear()
  );
  const [monthIdx, setMonthIdx] = useState<number>(
    dateRange.from?.getMonth() ?? today.getMonth()
  );

  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hospitals").select("*").eq("active", true).order("short_name");
      if (error) throw error;
      return data;
    },
  });

  const applyMonth = (y: number, m: number) => {
    const from = new Date(y, m, 1);
    const to = new Date(y, m + 1, 0);
    onDateRangeChange({ from, to });
  };

  const periodLabel = rangeActive
    ? `${format(dateRange.from!, "dd/MM/yy", { locale: ptBR })} – ${format(dateRange.to!, "dd/MM/yy", { locale: ptBR })}`
    : "Selecionar período";

  return (
    <div className="bg-card rounded-xl p-4 md:p-6 stat-card-shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-5">
        {/* Hospital Select */}
        <div className="lg:col-span-3">
          <label className="text-sm font-semibold text-foreground mb-2 block">Unidade Hospitalar</label>
          <Select value={selectedHospital} onValueChange={onHospitalChange}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
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
        <div className="lg:col-span-6 min-w-0">
          <label className="text-sm font-semibold text-foreground mb-2 block">Tipo de Serviço</label>
          <div className="flex flex-wrap gap-1.5">
            {serviceTypes.map((st) => {
              const active = selectedServices.includes(st.id);
              return (
                <Badge
                  key={st.id}
                  variant={active ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all whitespace-nowrap text-xs leading-none py-2 px-2.5 h-8 inline-flex items-center gap-1.5 rounded-md border",
                    active
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                      : "bg-background hover:bg-muted",
                  )}
                  onClick={() => onServiceToggle(st.id)}
                >
                  {iconMap[st.icon]}
                  <span>{st.label}</span>
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Period */}
        <div className="lg:col-span-3">
          <label className="text-sm font-semibold text-foreground mb-2 block">Período</label>
          <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal h-10",
                    !rangeActive && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate text-xs">{periodLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="end">
                <Tabs defaultValue="month" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full mb-3">
                    <TabsTrigger value="month">Mês</TabsTrigger>
                    <TabsTrigger value="custom">Intervalo Personalizado</TabsTrigger>
                  </TabsList>
                  <TabsContent value="month" className="space-y-3 mt-0">
                    <div className="flex gap-2">
                      <Select value={String(monthIdx)} onValueChange={(v) => setMonthIdx(Number(v))}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MONTH_NAMES.map((m, i) => (
                            <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={String(monthYear)} onValueChange={(v) => setMonthYear(Number(v))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => { applyMonth(monthYear, monthIdx); setOpen(false); }}
                    >
                      Aplicar {MONTH_NAMES[monthIdx]}/{monthYear}
                    </Button>
                  </TabsContent>
                  <TabsContent value="custom" className="mt-0">
                    <Calendar
                      mode="range"
                      selected={dateRange as any}
                      onSelect={(r: any) => onDateRangeChange(r || {})}
                      numberOfMonths={2}
                      locale={ptBR}
                      initialFocus
                      className={cn("p-0 pointer-events-auto")}
                    />
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
            {rangeActive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => onDateRangeChange({})}
                aria-label="Limpar período"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
