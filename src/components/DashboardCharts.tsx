import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { DateRange, isRangeActive, monthInRange, yearsInRange } from "@/lib/dateFilter";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface DashboardChartsProps {
  selectedServices: string[];
  hospitalIds: string[];
  dateRange: DateRange;
}

const DashboardCharts = ({ selectedServices, hospitalIds, dateRange }: DashboardChartsProps) => {
  const rangeActive = isRangeActive(dateRange);
  const rangeKey = rangeActive ? `${dateRange.from!.toISOString()}_${dateRange.to!.toISOString()}` : "";
  const hospitalKey = hospitalIds.slice().sort().join(",");

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
    queryKey: ["service_orders_charts", selectedServices, rangeKey],
    queryFn: async () => {
      let query = supabase.from("service_orders").select("*");
      if (rangeActive) {
        query = query.in("year", yearsInRange(dateRange));
      }
      if (selectedServices.length > 0) query = query.in("service_type", selectedServices);
      const { data, error } = await query;
      if (error) throw error;
      const rows = data || [];
      return rangeActive ? rows.filter((o: any) => monthInRange(o.year, o.month, dateRange)) : rows;
    },
  });

  const isAll = hospitalIds.length === 0 || hospitalIds.length === hospitals.length;

  const filteredOrders = useMemo(
    () => (isAll ? orders : orders.filter((o: any) => hospitalIds.includes(o.hospital_id))),
    [orders, hospitalIds, isAll],
  );

  const lineData = useMemo(() => {
    return MONTHS.map((name, i) => {
      const monthNum = i + 1;
      const monthOrders = filteredOrders.filter((o: any) => o.month === monthNum);
      const abertas = monthOrders.reduce((s: number, o: any) => s + (o.os_abertas || 0), 0);
      const finalizadas = monthOrders.reduce((s: number, o: any) => s + (o.os_finalizadas || 0), 0);
      return {
        name,
        percentual: abertas > 0 ? Math.round((finalizadas / abertas) * 1000) / 10 : null,
      };
    });
  }, [filteredOrders]);

  const barData = useMemo(() => {
    const hospitalsToShow = isAll ? hospitals : hospitals.filter((h: any) => hospitalIds.includes(h.id));
    return hospitalsToShow.map((h: any) => {
      const hOrders = filteredOrders.filter((o: any) => o.hospital_id === h.id);
      const finalizadas = hOrders.reduce((s: number, o: any) => s + (o.os_finalizadas || 0), 0);
      const abertas = hOrders.reduce((s: number, o: any) => s + (o.os_abertas || 0), 0);
      return {
        name: h.short_name,
        finalizadas,
        pendentes: Math.max(0, abertas - finalizadas),
      };
    });
  }, [filteredOrders, hospitals, hospitalIds, isAll]);

  const selectedHospitalName = useMemo(() => {
    if (isAll) return "Geral";
    const selected = hospitals.filter((h: any) => hospitalIds.includes(h.id));
    if (selected.length === 1) return selected[0].name;
    if (selected.length <= 3) return selected.map((h: any) => h.short_name).join(" + ");
    return `${selected.length} hospitais`;
  }, [hospitals, hospitalIds, isAll]);

  const lineTitle = `Percentual de OS's Finalizadas — ${selectedHospitalName}`;
  const barTitle = isAll || hospitalIds.length > 1
    ? "Total de OS's por Unidade"
    : `Total de OS's — ${selectedHospitalName}`;
  // unused ref to keep variable name
  void hospitalKey;

  return (
    <div className="space-y-4 animate-fade-in">
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
            {isAll || hospitalIds.length > 1 ? "Comparativo entre unidades" : "Total de ordens de serviço"}
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
