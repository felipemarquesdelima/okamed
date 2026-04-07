import { CheckCircle } from "lucide-react";

interface AlertStatusProps {
  acumCritico: number;
}

const AlertStatus = ({ acumCritico }: AlertStatusProps) => {
  if (acumCritico === 0) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-success" />
        <div>
          <p className="text-sm font-medium text-foreground">Sem alertas críticos</p>
          <p className="text-xs text-muted-foreground">Todas as unidades estão operando dentro das metas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-center gap-3">
      <div className="h-5 w-5 rounded-full bg-warning flex items-center justify-center">
        <span className="text-warning-foreground text-xs font-bold">!</span>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{acumCritico} alerta(s) crítico(s)</p>
        <p className="text-xs text-muted-foreground">Existem OS's pendentes que requerem atenção</p>
      </div>
    </div>
  );
};

export default AlertStatus;
