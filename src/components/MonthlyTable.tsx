import { MonthlyData } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, ListChecks } from "lucide-react";
import { serviceTypes } from "@/lib/mockData";

interface MonthlyTableProps {
  data: MonthlyData[];
  goalPercent: number;
}

const MonthlyTable = ({ data, goalPercent }: MonthlyTableProps) => {
  const getServiceLabel = (serviceType: string) =>
    serviceTypes.find((service) => service.id === serviceType)?.label || serviceType;

  const formatDate = (date: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`));

  const formatCost = (cost: number | null) => cost === null
    ? "Não informado"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cost);

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
                    <span className={row.percentual >= goalPercent ? "text-success font-medium" : "text-destructive font-medium"}>
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
                      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Análise crítica e plano 5W2H — {row.month}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {row.serviceDetails?.length ? row.serviceDetails.map((detail) => (
                            <section key={detail.serviceOrderId} className="rounded-lg border bg-card p-4 space-y-4">
                              <div>
                                <p className="text-xs font-medium uppercase text-muted-foreground">Serviço</p>
                                <h4 className="text-sm font-semibold text-foreground">{getServiceLabel(detail.serviceType)}</h4>
                              </div>
                              <div>
                                <h5 className="text-sm font-semibold text-foreground mb-1">Análise crítica</h5>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{detail.analiseCritica}</p>
                              </div>

                              {detail.actionPlan && (
                                <>
                                  <Separator />
                                  <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <ListChecks className="h-4 w-4 text-primary" />
                                        <h5 className="text-sm font-semibold text-foreground">Plano de ação 5W2H</h5>
                                      </div>
                                      <Badge variant="outline" className="capitalize">{detail.actionPlan.status}</Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                      <div>
                                        <p className="text-xs text-muted-foreground">Percentual atingido</p>
                                        <p className="text-sm font-semibold text-destructive">{detail.actionPlan.achievedPercent}%</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Meta</p>
                                        <p className="text-sm font-semibold text-foreground">{detail.actionPlan.goalPercent}%</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Prazo</p>
                                        <p className="text-sm font-medium text-foreground">{formatDate(detail.actionPlan.dueDate)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Custo previsto</p>
                                        <p className="text-sm font-medium text-foreground">{formatCost(detail.actionPlan.estimatedCost)}</p>
                                      </div>
                                    </div>

                                    <dl className="grid gap-3 sm:grid-cols-2">
                                      <div><dt className="text-xs font-medium text-muted-foreground">O que será feito?</dt><dd className="text-sm text-foreground whitespace-pre-wrap">{detail.actionPlan.whatAction}</dd></div>
                                      <div><dt className="text-xs font-medium text-muted-foreground">Por que será feito?</dt><dd className="text-sm text-foreground whitespace-pre-wrap">{detail.actionPlan.whyAction}</dd></div>
                                      <div><dt className="text-xs font-medium text-muted-foreground">Onde?</dt><dd className="text-sm text-foreground whitespace-pre-wrap">{detail.actionPlan.whereAction}</dd></div>
                                      <div><dt className="text-xs font-medium text-muted-foreground">Quem será o responsável?</dt><dd className="text-sm text-foreground whitespace-pre-wrap">{detail.actionPlan.responsible}</dd></div>
                                      <div className="sm:col-span-2"><dt className="text-xs font-medium text-muted-foreground">Como será feito?</dt><dd className="text-sm text-foreground whitespace-pre-wrap">{detail.actionPlan.howAction}</dd></div>
                                    </dl>
                                  </div>
                                </>
                              )}
                            </section>
                          )) : (
                            <p className="text-sm text-muted-foreground leading-relaxed">{row.analiseCritica}</p>
                          )}
                        </div>
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
               <TableCell className="text-right">{goalPercent}%</TableCell>
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
