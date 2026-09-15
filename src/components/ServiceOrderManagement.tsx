import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ClipboardList, AlertCircle } from "lucide-react";
import { z } from "zod";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const SERVICE_TYPES = [
  { id: "corretiva", label: "Manutenção Corretiva" },
  { id: "preventiva", label: "Manutenção Preventiva" },
  { id: "calibracao", label: "Calibração" },
  { id: "eletrica", label: "Teste de Segurança Elétrica" },
];

type ServiceType = (typeof SERVICE_TYPES)[number]["id"];

interface ServiceOrderRow {
  id: string;
  serviceType: ServiceType;
  osAbertas: number;
  osFinalizadas: number;
  meta: number;
  acumCritico: number;
  acumGeral: number;
  analiseCritica: string;
}

const serviceOrderRowSchema = z.object({
  serviceType: z.enum(["corretiva", "preventiva", "calibracao", "eletrica"]),
  osAbertas: z.number().int().min(0).max(999999),
  osFinalizadas: z.number().int().min(0).max(999999),
  meta: z.number().min(0).max(100),
  acumCritico: z.number().int().min(0).max(999999),
  acumGeral: z.number().int().min(0).max(999999),
  analiseCritica: z.string().trim().max(2000),
});

const createServiceRow = (serviceType: ServiceType = "corretiva"): ServiceOrderRow => ({
  id: crypto.randomUUID(),
  serviceType,
  osAbertas: 0,
  osFinalizadas: 0,
  meta: 90,
  acumCritico: 0,
  acumGeral: 0,
  analiseCritica: "",
});

interface ServiceOrderManagementProps {
  userRole?: string;
}

const ServiceOrderManagement = ({ userRole = "admin" }: ServiceOrderManagementProps) => {
  const isController = userRole === "controlador";
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState("");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1);
  const [serviceType, setServiceType] = useState("corretiva");
  const [osAbertas, setOsAbertas] = useState(0);
  const [osFinalizadas, setOsFinalizadas] = useState(0);
  const [meta, setMeta] = useState(90);
  const [acumCritico, setAcumCritico] = useState(0);
  const [acumGeral, setAcumGeral] = useState(0);
  const [analiseCritica, setAnaliseCritica] = useState("—");
  const [filterHospital, setFilterHospital] = useState("all");
  const [filterYear, setFilterYear] = useState(2026);
  const [serviceRows, setServiceRows] = useState<ServiceOrderRow[]>([createServiceRow()]);
  const [formError, setFormError] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignedHospitals = [], isLoading: isLoadingAssignment } = useQuery({
    queryKey: ["current_hospital_assignments", isController],
    enabled: isController,
    queryFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData.user;
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_hospital_assignments")
        .select("hospital_id, hospitals(id, name, short_name)")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
  });

  const assignedHospitalIds = isController ? assignedHospitals.map((a: any) => a.hospital_id) : [];
  const hasAssignments = !isController || assignedHospitalIds.length > 0;

  useEffect(() => {
    if (isController && assignedHospitalIds.length > 0) {
      if (!hospitalId || !assignedHospitalIds.includes(hospitalId)) {
        setHospitalId(assignedHospitalIds[0]);
      }
      if (filterHospital !== "all" && !assignedHospitalIds.includes(filterHospital)) {
        setFilterHospital(assignedHospitalIds.length === 1 ? assignedHospitalIds[0] : "all");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isController, assignedHospitals.length]);

  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals", assignedHospitalIds.join(","), isController],
    enabled: !isController || hasAssignments,
    queryFn: async () => {
      let query = supabase.from("hospitals").select("*").eq("active", true).order("name");
      if (isController && assignedHospitalIds.length > 0) {
        query = query.in("id", assignedHospitalIds);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["service_orders", filterHospital, filterYear, assignedHospitalIds.join(","), isController],
    enabled: !isController || hasAssignments,
    queryFn: async () => {
      let query = supabase
        .from("service_orders")
        .select("*, hospitals(name, short_name)")
        .eq("year", filterYear)
        .order("month");

      if (filterHospital && filterHospital !== "all") {
        query = query.eq("hospital_id", filterHospital);
      } else if (isController && assignedHospitalIds.length > 0) {
        query = query.in("hospital_id", assignedHospitalIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const resetForm = () => {
    setEditId(null);
    setHospitalId(isController && assignedHospitalIds.length > 0 ? assignedHospitalIds[0] : "");
    setYear(2026);
    setMonth(1);
    setServiceType("corretiva");
    setOsAbertas(0);
    setOsFinalizadas(0);
    setMeta(90);
    setAcumCritico(0);
    setAcumGeral(0);
    setAnaliseCritica("—");
    setServiceRows([createServiceRow()]);
    setFormError("");
    setOpen(false);
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: any | any[]) => {
      if (Array.isArray(payload)) {
        const serviceTypes = payload.map((row) => row.service_type);
        const { data: existing, error: lookupError } = await supabase
          .from("service_orders")
          .select("service_type")
          .eq("hospital_id", hospitalId)
          .eq("year", year)
          .eq("month", month)
          .in("service_type", serviceTypes);

        if (lookupError) throw lookupError;
        if (existing && existing.length > 0) {
          const labels = existing
            .map((item) => SERVICE_TYPES.find((type) => type.id === item.service_type)?.label || item.service_type)
            .join(", ");
          throw new Error(`Já existe uma OS cadastrada para: ${labels}. Nenhuma ordem foi salva.`);
        }

        const { error } = await supabase.from("service_orders").insert(payload);
        if (error?.code === "23505") {
          throw new Error("Uma destas ordens já foi cadastrada. Nenhuma ordem foi salva.");
        }
        if (error) throw error;
      } else if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("service_orders").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("service_orders").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
      toast({ title: editId ? "OS atualizada!" : `${serviceRows.length} ${serviceRows.length === 1 ? "OS cadastrada" : "OS cadastradas"}!` });
      resetForm();
    },
    onError: (err: any) => {
      const message = err instanceof Error ? err.message : "Não foi possível salvar as ordens.";
      setFormError(message);
      toast({ title: "Não foi possível salvar", description: message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
      toast({ title: "OS removida!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const handleEdit = (order: any) => {
    setEditId(order.id);
    setHospitalId(order.hospital_id);
    setYear(order.year);
    setMonth(order.month);
    setServiceType(order.service_type);
    setOsAbertas(order.os_abertas);
    setOsFinalizadas(order.os_finalizadas);
    setMeta(Number(order.meta));
    setAcumCritico(order.acum_critico);
    setAcumGeral(order.acum_geral);
    setAnaliseCritica(order.analise_critica || "—");
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!editId) {
      const uniqueTypes = new Set(serviceRows.map((row) => row.serviceType));
      if (uniqueTypes.size !== serviceRows.length) {
        setFormError("Cada tipo de serviço pode ser incluído apenas uma vez.");
        return;
      }

      const parsedRows = z.array(serviceOrderRowSchema).min(1).max(SERVICE_TYPES.length).safeParse(serviceRows);
      if (!hospitalId || !Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12 || !parsedRows.success) {
        setFormError("Revise os campos. Use valores válidos e não negativos; a meta deve estar entre 0 e 100.");
        return;
      }

      const payload = parsedRows.data.map((row) => ({
        hospital_id: hospitalId,
        year,
        month,
        service_type: row.serviceType,
        os_abertas: row.osAbertas,
        os_finalizadas: row.osFinalizadas,
        meta: row.meta,
        acum_critico: row.acumCritico,
        acum_geral: row.acumGeral,
        analise_critica: row.analiseCritica || "—",
      }));
      upsertMutation.mutate(payload);
      return;
    }

    const payload: any = {
      hospital_id: hospitalId,
      year,
      month,
      service_type: serviceType,
      os_abertas: osAbertas,
      os_finalizadas: osFinalizadas,
      meta,
      acum_critico: acumCritico,
      acum_geral: acumGeral,
      analise_critica: analiseCritica,
    };
    if (editId) payload.id = editId;
    upsertMutation.mutate(payload);
  };

  const updateServiceRow = <K extends keyof Omit<ServiceOrderRow, "id">>(id: string, field: K, value: ServiceOrderRow[K]) => {
    setFormError("");
    setServiceRows((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row));
  };

  const addServiceRow = () => {
    const usedTypes = new Set(serviceRows.map((row) => row.serviceType));
    const nextType = SERVICE_TYPES.find((type) => !usedTypes.has(type.id))?.id;
    if (!nextType) return;
    setFormError("");
    setServiceRows((rows) => [...rows, createServiceRow(nextType)]);
  };

  const removeServiceRow = (id: string) => {
    if (serviceRows.length === 1) return;
    setFormError("");
    setServiceRows((rows) => rows.filter((row) => row.id !== id));
  };

  const percentual = osAbertas > 0 ? ((osFinalizadas / osAbertas) * 100).toFixed(1) : "0.0";
  const canSubmit = !!hospitalId;

  if (isController && !isLoadingAssignment && assignedHospitalIds.length === 0) {
    return <p className="text-sm text-muted-foreground">Sua conta não possui hospital atribuído.</p>;
  }


  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Alimentação de Dados - OS</h3>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova OS
            </Button>
          </DialogTrigger>
          <DialogContent className={`${editId ? "max-w-lg" : "max-w-5xl"} max-h-[90vh] overflow-y-auto`}>
            <DialogHeader>
              <DialogTitle>{editId ? "Editar OS" : "Nova Ordem de Serviço"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Hospital</Label>
                  <Select value={hospitalId} onValueChange={setHospitalId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((h) => (
                        <SelectItem key={h.id} value={h.id}>{h.short_name} - {h.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <Label>Mês</Label>
                  <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editId && <>
                  <div className="space-y-2 col-span-2">
                    <Label>Tipo de Serviço</Label>
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SERVICE_TYPES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>OS Abertas</Label><Input type="number" min={0} value={osAbertas} onChange={(e) => setOsAbertas(Number(e.target.value))} /></div>
                  <div className="space-y-2"><Label>OS Finalizadas</Label><Input type="number" min={0} value={osFinalizadas} onChange={(e) => setOsFinalizadas(Number(e.target.value))} /></div>
                  <div className="space-y-2"><Label>Meta (%)</Label><Input type="number" min={0} max={100} value={meta} onChange={(e) => setMeta(Number(e.target.value))} /></div>
                  <div className="space-y-2"><Label>Percentual</Label><Input value={`${percentual}%`} disabled className="bg-muted" /></div>
                  <div className="space-y-2"><Label>Acum. Crítico</Label><Input type="number" min={0} value={acumCritico} onChange={(e) => setAcumCritico(Number(e.target.value))} /></div>
                  <div className="space-y-2"><Label>Acum. Geral</Label><Input type="number" min={0} value={acumGeral} onChange={(e) => setAcumGeral(Number(e.target.value))} /></div>
                </>}
              </div>
              {editId ? <div className="space-y-2">
                <Label>Análise Crítica</Label>
                <Textarea value={analiseCritica} onChange={(e) => setAnaliseCritica(e.target.value)} rows={3} />
              </div> : <>
                <section className="space-y-3" aria-labelledby="service-orders-heading">
                  <div className="flex items-center justify-between gap-3">
                    <h4 id="service-orders-heading" className="text-sm font-semibold text-foreground">Ordens de serviço</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addServiceRow} disabled={serviceRows.length === SERVICE_TYPES.length}>
                      <Plus className="h-4 w-4 mr-1" /> Adicionar serviço
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {serviceRows.map((row) => {
                      const percentage = row.osAbertas > 0 ? ((row.osFinalizadas / row.osAbertas) * 100).toFixed(1) : "0.0";
                      const selectedByOthers = new Set(serviceRows.filter((item) => item.id !== row.id).map((item) => item.serviceType));
                      return <div key={row.id} className="grid grid-cols-2 gap-3 rounded-md border p-3 sm:grid-cols-4 lg:grid-cols-[2fr_repeat(6,1fr)_auto]">
                        <div className="col-span-2 space-y-1 sm:col-span-4 lg:col-span-1">
                          <Label>Tipo de serviço</Label>
                          <Select value={row.serviceType} onValueChange={(value) => updateServiceRow(row.id, "serviceType", value as ServiceType)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{SERVICE_TYPES.filter((type) => !selectedByOthers.has(type.id)).map((type) => <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1"><Label>OS abertas</Label><Input type="number" min={0} max={999999} value={row.osAbertas} onChange={(e) => updateServiceRow(row.id, "osAbertas", Number(e.target.value))} /></div>
                        <div className="space-y-1"><Label>OS finalizadas</Label><Input type="number" min={0} max={999999} value={row.osFinalizadas} onChange={(e) => updateServiceRow(row.id, "osFinalizadas", Number(e.target.value))} /></div>
                        <div className="space-y-1"><Label>Meta (%)</Label><Input type="number" min={0} max={100} value={row.meta} onChange={(e) => updateServiceRow(row.id, "meta", Number(e.target.value))} /></div>
                        <div className="space-y-1"><Label>Percentual</Label><Input value={`${percentage}%`} disabled className="bg-muted" /></div>
                        <div className="space-y-1"><Label>Acum. Crítico</Label><Input type="number" min={0} max={999999} value={row.acumCritico} onChange={(e) => updateServiceRow(row.id, "acumCritico", Number(e.target.value))} /></div>
                        <div className="space-y-1"><Label>Acum. Geral</Label><Input type="number" min={0} max={999999} value={row.acumGeral} onChange={(e) => updateServiceRow(row.id, "acumGeral", Number(e.target.value))} /></div>
                        <div className="flex items-end justify-end">
                          <Button type="button" variant="ghost" size="icon" aria-label="Remover serviço" title="Remover serviço" onClick={() => removeServiceRow(row.id)} disabled={serviceRows.length === 1}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>;
                    })}
                  </div>
                </section>
                <section className="space-y-3" aria-labelledby="critical-analysis-heading">
                  <h4 id="critical-analysis-heading" className="text-sm font-semibold text-foreground">Análise crítica por serviço</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {serviceRows.map((row) => <div key={row.id} className="space-y-1">
                      <Label>{SERVICE_TYPES.find((type) => type.id === row.serviceType)?.label}</Label>
                      <Textarea maxLength={2000} value={row.analiseCritica} onChange={(e) => updateServiceRow(row.id, "analiseCritica", e.target.value)} placeholder="Registrar análise crítica..." rows={3} />
                    </div>)}
                  </div>
                </section>
              </>}
              {formError && <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={upsertMutation.isPending || !canSubmit}>
                  {upsertMutation.isPending ? "Salvando..." : editId ? "Salvar" : `Salvar ${serviceRows.length} ${serviceRows.length === 1 ? "ordem" : "ordens"}`}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="w-56">
          <Select value={filterHospital} onValueChange={setFilterHospital}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar hospital" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isController ? "Todos os meus hospitais" : "Todos os Hospitais"}</SelectItem>
              {hospitals.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.short_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-28">
          <Input type="number" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} />
        </div>
      </div>

      {isLoading || isLoadingAssignment ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma OS cadastrada para os filtros selecionados.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Mês</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Abertas</TableHead>
                <TableHead className="text-right">Finalizadas</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Meta</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o: any) => {
                const pct = o.os_abertas > 0 ? ((o.os_finalizadas / o.os_abertas) * 100).toFixed(1) : "0.0";
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-semibold">{o.hospitals?.short_name || "—"}</TableCell>
                    <TableCell>{MONTHS[o.month - 1]}</TableCell>
                    <TableCell className="text-xs">{SERVICE_TYPES.find((s) => s.id === o.service_type)?.label || o.service_type}</TableCell>
                    <TableCell className="text-right">{o.os_abertas}</TableCell>
                    <TableCell className="text-right">{o.os_finalizadas}</TableCell>
                    <TableCell className="text-right">{pct}%</TableCell>
                    <TableCell className="text-right">{o.meta}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(o)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(o.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ServiceOrderManagement;
