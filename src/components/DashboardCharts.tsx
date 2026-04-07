import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { MonthlyData } from "@/lib/mockData";
import { hospitals } from "@/lib/mockData";

interface DashboardChartsProps {
  data: MonthlyData[];
  hospitalId: string;
}

const DashboardCharts = ({ data, hospitalId }: DashboardChartsProps) => {
  const hospital = hospitals.find(h => h.id === hospitalId);
  const chartData = data.map(d => ({
    name: d.month,
    percentual: d.osAbertas > 0 ? d.percentual : null,
  }));

  const barData = [{
    name: hospital?.shortName || "HC",
    finalizadas: data.filter(d => d.osAbertas > 0).reduce((s, d) => s + d.osFinalizadas, 0),
    pendentes: data.filter(d => d.osAbertas > 0).reduce((s, d) => s + (d.osAbertas - d.osFinalizadas), 0),
  }];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card rounded-xl p-5 stat-card-shadow">
        <h3 className="text-base font-semibold text-foreground mb-1">Percentual de OS's Finalizadas</h3>
        <p className="text-xs text-muted-foreground mb-4">Evolução mensal por unidade hospitalar</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[0, 110]} tickFormatter={v => `${v}%`} />
            <Tooltip />
            <ReferenceLine y={90} stroke="hsl(var(--success))" strokeDasharray="8 4" label={{ value: "Meta 90%", fill: "hsl(var(--success))", fontSize: 11 }} />
            <Line type="monotone" dataKey="percentual" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} name={hospital?.shortName} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl p-5 stat-card-shadow">
        <h3 className="text-base font-semibold text-foreground mb-1">Total de OS's por Unidade</h3>
        <p className="text-xs text-muted-foreground mb-4">Comparativo anual de ordens de serviço</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="finalizadas" name="Finalizadas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pendentes" name="Pendentes" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
