import { FileText, CheckCircle, Target, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  totalAbertas: number;
  totalFinalizadas: number;
  taxaConclusao: number;
  acumCritico: number;
}

const StatsCards = ({ totalAbertas, totalFinalizadas, taxaConclusao, acumCritico }: StatsCardsProps) => {
  const cards = [
    {
      title: "Total OS's Abertas",
      value: totalAbertas,
      subtitle: "Período selecionado",
      icon: <FileText className="h-5 w-5" />,
      iconBg: "bg-info/10 text-info",
    },
    {
      title: "OS's Finalizadas",
      value: totalFinalizadas,
      subtitle: `${totalAbertas > 0 ? ((totalFinalizadas / totalAbertas) * 100).toFixed(1) : 0}% do total`,
      icon: <CheckCircle className="h-5 w-5" />,
      iconBg: "bg-success/10 text-success",
    },
    {
      title: "Taxa de Conclusão",
      value: `${taxaConclusao}%`,
      subtitle: "Meta: 90%",
      icon: <Target className="h-5 w-5" />,
      iconBg: "bg-success/10 text-success",
      badge: taxaConclusao >= 90
        ? { text: `+${(taxaConclusao - 90).toFixed(1)}%`, color: "bg-success/10 text-success" }
        : { text: `${(taxaConclusao - 90).toFixed(1)}%`, color: "bg-destructive/10 text-destructive" },
    },
    {
      title: "Acumulado Crítico",
      value: acumCritico,
      subtitle: "OS's pendentes críticas",
      icon: <AlertTriangle className="h-5 w-5" />,
      iconBg: "bg-warning/10 text-warning",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-card rounded-xl p-5 stat-card-shadow stat-card-hover">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
            <div className={`p-2 rounded-lg ${card.iconBg}`}>{card.icon}</div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{card.value}</p>
          <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          {card.badge && (
            <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${card.badge.color}`}>
              {card.badge.text} vs. mês anterior
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
