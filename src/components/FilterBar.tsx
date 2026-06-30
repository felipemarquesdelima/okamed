import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { serviceTypes } from "@/lib/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Building2, Wrench, Calendar as CalendarIcon, Settings, Zap, X, Search, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { DateRange } from "@/lib/dateFilter";
import { isRangeActive } from "@/lib/dateFilter";

interface FilterBarProps {
  selectedHospitalIds: string[];
  onHospitalIdsChange: (ids: string[]) => void;
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
  selectedHospitalIds, onHospitalIdsChange,
  selectedServices, onServiceToggle,
  dateRange, onDateRangeChange,
}: FilterBarProps) => {
  const rangeActive = isRangeActive(dateRange);
  const [open, setOpen] = useState(false);
  const [hospitalOpen, setHospitalOpen] = useState(false);
  const [hospitalSearch, setHospitalSearch] = useState("");
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

  const allCount = hospitals.length;
  const selCount = selectedHospitalIds.length;
  const isAll = selCount === 0 || selCount === allCount;

  const hospitalLabel = useMemo(() => {
    if (isAll) return "Geral (Todos os Hospitais)";
    const selected = hospitals.filter((h: any) => selectedHospitalIds.includes(h.id));
    if (selected.length <= 3) return selected.map((h: any) => h.short_name).join(" + ");
    return `${selected.length} hospitais selecionados`;
  }, [hospitals, selectedHospitalIds, isAll]);

  const filteredHospitals = useMemo(() => {
    const q = hospitalSearch.trim().toLowerCase();
    if (!q) return hospitals;
    return hospitals.filter((h: any) =>
      h.name.toLowerCase().includes(q) || h.short_name.toLowerCase().includes(q)
    );
  }, [hospitals, hospitalSearch]);

  const toggleHospital = (id: string) => {
    if (selectedHospitalIds.includes(id)) {
      onHospitalIdsChange(selectedHospitalIds.filter((x) => x !== id));
    } else {
      onHospitalIdsChange([...selectedHospitalIds, id]);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 md:p-6 stat-card-shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-5">
        {/* Hospital Multi-Select */}
        <div className="lg:col-span-3">
          <label className="text-sm font-semibold text-foreground mb-2 block">Unidade Hospitalar</label>
          <Popover open={hospitalOpen} onOpenChange={setHospitalOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-10"
              >
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{hospitalLabel}</span>
                {!isAll && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">{selCount}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar hospital..."
                    value={hospitalSearch}
                    onChange={(e) => setHospitalSearch(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 border-b text-xs">
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => onHospitalIdsChange(hospitals.map((h: any) => h.id))}
                >
                  Selecionar todos
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground hover:underline"
                  onClick={() => onHospitalIdsChange([])}
                >
                  Limpar seleção
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto p-1">
                {filteredHospitals.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    Nenhum hospital encontrado
                  </div>
                )}
                {filteredHospitals.map((h: any) => {
                  const checked = selectedHospitalIds.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggleHospital(h.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-sm hover:bg-muted transition-colors",
                        checked && "bg-muted/60"
                      )}
                    >
                      <Checkbox checked={checked} className="pointer-events-none" />
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{h.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{h.short_name}</div>
                      </div>
                      {checked && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="p-2 border-t flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {isAll ? "Todos" : `${selCount} de ${allCount}`} selecionado{selCount === 1 ? "" : "s"}
                </span>
                <Button size="sm" onClick={() => setHospitalOpen(false)}>Aplicar</Button>
              </div>
            </PopoverContent>
          </Popover>
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
