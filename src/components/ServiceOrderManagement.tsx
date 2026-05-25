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
import { Plus, Pencil, Trash2, ClipboardList } from "lucide-react";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const SERVICE_TYPES = [
  { id: "corretiva", label: "Manutenção Corretiva" },
  { id: "preventiva", label: "Manutenção Preventiva" },
  { id: "calibracao", label: "Calibração" },
  { id: "eletrica", label: "Teste de Segurança Elétrica" },
];

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
    setOpen(false);
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
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
      toast({ title: editId ? "OS atualizada!" : "OS cadastrada!" });
      resetForm();
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar OS" : "Nova Ordem de Serviço"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="space-y-2 col-span-2">
                  <Label>Tipo de Serviço</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>OS Abertas</Label>
                  <Input type="number" value={osAbertas} onChange={(e) => setOsAbertas(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>OS Finalizadas</Label>
                  <Input type="number" value={osFinalizadas} onChange={(e) => setOsFinalizadas(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Meta (%)</Label>
                  <Input type="number" value={meta} onChange={(e) => setMeta(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Percentual</Label>
                  <Input value={`${percentual}%`} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Acum. Crítico</Label>
                  <Input type="number" value={acumCritico} onChange={(e) => setAcumCritico(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Acum. Geral</Label>
                  <Input type="number" value={acumGeral} onChange={(e) => setAcumGeral(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Análise Crítica</Label>
                <Textarea value={analiseCritica} onChange={(e) => setAnaliseCritica(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={upsertMutation.isPending || !canSubmit}>
                  {upsertMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        {isController ? (
          <div className="w-72">
            <Input value={assignedHospitalLabel} disabled className="bg-muted" />
          </div>
        ) : (
          <div className="w-48">
            <Select value={filterHospital} onValueChange={setFilterHospital}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar hospital" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Hospitais</SelectItem>
                {hospitals.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.short_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
