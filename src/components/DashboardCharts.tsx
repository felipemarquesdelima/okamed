import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface DashboardChartsProps {
  selectedYear: number;
  selectedServices: string[];
}

const DashboardCharts = ({ selectedYear, selectedServices }: DashboardChartsProps) => {
  const [hospitalFilter, setHospitalFilter] = useState<string>("all");

  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals-charts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .eq("active", true)
        .order("short_name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["service_orders_charts", selectedYear, selectedServices],
    queryFn: async () => {
      let query = supabase.from("service_orders").select("*").eq("year", selectedYear);
      if (selectedServices.length > 0) query = query.in("service_type", selectedServices);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filteredOrders = useMemo(
    () => (hospitalFilter === "all" ? orders : orders.filter((o: any) => o.hospital_id === hospitalFilter)),
    [orders, hospitalFilter],
  );

  // Line chart: monthly % finalizadas
  const lineData = useMemo(() => {
    return MONTHS.map((name, i) => {
      const monthOrders = filteredOrders.filter((o: any) => o.month === i + 1);
      const abertas = monthOrders.reduce((s: number, o: any) => s + (o.os_abertas || 0), 0);
      const finalizadas = monthOrders.reduce((s: number, o: any) => s + (o.os_finalizadas || 0), 0);
      return {
        name,
        percentual: abertas > 0 ? Math.round((finalizadas / abertas) * 1000) / 10 : null,
      };
    });
  }, [filteredOrders]);

  // Bar chart: per-hospital totals (or single hospital)
  const barData = useMemo(() => {
    const hospitalsToShow = hospitalFilter === "all" ? hospitals : hospitals.filter((h: any) => h.id === hospitalFilter);
    return hospitalsToShow.map((h: any) => {
      const hOrders = orders.filter((o: any) => o.hospital_id === h.id);
      const finalizadas = hOrders.reduce((s: number, o: any) => s + (o.os_finalizadas || 0), 0);
      const abertas = hOrders.reduce((s: number, o: any) => s + (o.os_abertas || 0), 0);
      return {
        name: h.short_name,
        finalizadas,
        pendentes: Math.max(0, abertas - finalizadas),
      };
    });
  }, [orders, hospitals, hospitalFilter]);

  const selectedHospitalName =
    hospitalFilter === "all"
      ? "Geral"
      : hospitals.find((h: any) => h.id === hospitalFilter)?.name || "";

  const lineTitle =
    hospitalFilter === "all"
      ? "Percentual de OS's Finalizadas — Geral"
      : `Percentual de OS's Finalizadas — ${selectedHospitalName}`;

  const barTitle =
    hospitalFilter === "all"
      ? "Total de OS's por Unidade"
      : `Total de OS's — ${selectedHospitalName}`;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Section filter */}
      <div className="bg-card rounded-xl p-4 stat-card-shadow flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Hospital / Unidade
        </label>
        <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
          <SelectTrigger className="w-full sm:max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Geral (Todos os Hospitais)</SelectItem>
            {hospitals.map((h: any) => (
              <SelectItem key={h.id} value={h.id}>
                {h.name} ({h.short_name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5 stat-card-shadow flex flex-col">
          <h3 className="text-base font-semibold text-foreground mb-1">{lineTitle}</h3>
          <p className="text-xs text-muted-foreground mb-4">Evolução mensal — meta 90%</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[0, 110]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: any) => (v == null ? "—" : `${v}%`)} />
              <ReferenceLine
                y={90}
                stroke="hsl(var(--success))"
                strokeDasharray="8 4"
                label={{ value: "Meta 90%", fill: "hsl(var(--success))", fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="percentual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls={false}
                name={selectedHospitalName}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-5 stat-card-shadow flex flex-col">
          <h3 className="text-base font-semibold text-foreground mb-1">{barTitle}</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {hospitalFilter === "all" ? "Comparativo anual entre unidades" : "Total anual de ordens de serviço"}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="finalizadas" name="Finalizadas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} isAnimationActive />
              <Bar dataKey="pendentes" name="Pendentes" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
