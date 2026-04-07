import { MonthlyData } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface MonthlyTableProps {
  data: MonthlyData[];
}

const MonthlyTable = ({ data }: MonthlyTableProps) => {
  const totals = {
    osAbertas: data.reduce((s, d) => s + d.osAbertas, 0),
    osFinalizadas: data.reduce((s, d) => s + d.osFinalizadas, 0),
    acumCritico: data.reduce((s, d) => s + d.acumCritico, 0),
    acumGeral: data.reduce((s, d) => s + d.acumGeral, 0),
  };
  const totalPerc = totals.osAbertas > 0 ? ((totals.osFinalizadas / totals.osAbertas) * 100).toFixed(1) : "N/A";

  return (
    <div className="bg-card rounded-xl p-5 stat-card-shadow">
      <h3 className="text-base font-semibold text-foreground mb-1">Detalhamento Mensal</h3>
      <p className="text-xs text-muted-foreground mb-4">Dados completos de ordens de serviço com análise crítica</p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">OS Abertas</TableHead>
              <TableHead className="text-right">OS Finalizadas</TableHead>
              <TableHead className="text-right">% Atingido</TableHead>
              <TableHead className="text-right">Meta</TableHead>
              <TableHead className="text-right">Acum. Crítico</TableHead>
              <TableHead className="text-right">Acum. Geral</TableHead>
              <TableHead>Análise</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium">{row.month}</TableCell>
                <TableCell className="text-right">{row.osAbertas || "-"}</TableCell>
                <TableCell className="text-right">{row.osFinalizadas || "-"}</TableCell>
                <TableCell className="text-right">
                  {row.osAbertas > 0 ? (
                    <span className={row.percentual >= 90 ? "text-success font-medium" : "text-destructive font-medium"}>
                      {row.percentual}%
                    </span>
                  ) : "N/A"}
                </TableCell>
                <TableCell className="text-right">{row.meta}%</TableCell>
                <TableCell className="text-right">{row.acumCritico || "-"}</TableCell>
                <TableCell className="text-right">{row.acumGeral || "-"}</TableCell>
                <TableCell>
                  {row.analiseCritica !== "—" ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Análise Crítica - {row.month}</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground leading-relaxed">{row.analiseCritica}</p>
                      </DialogContent>
                    </Dialog>
                  ) : "—"}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-muted/50">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{totals.osAbertas}</TableCell>
              <TableCell className="text-right">{totals.osFinalizadas}</TableCell>
              <TableCell className="text-right">{totalPerc}%</TableCell>
              <TableCell className="text-right">90%</TableCell>
              <TableCell className="text-right">{totals.acumCritico}</TableCell>
              <TableCell className="text-right">{totals.acumGeral}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MonthlyTable;
