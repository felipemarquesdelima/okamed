import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("cliente");
  const [hospitalIds, setHospitalIds] = useState<string[]>([]);

  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const { data } = await supabase.from("hospitals").select("*").eq("active", true).order("short_name");
      return data || [];
    },
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["managed_users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (!profiles) return [];

      const userIds = profiles.map((p) => p.user_id);
      const { data: roles } = await supabase.from("user_roles").select("*").in("user_id", userIds);
      const { data: assignments } = await supabase
        .from("user_hospital_assignments")
        .select("*, hospitals(short_name, name)")
        .in("user_id", userIds);

      return profiles.map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.user_id)?.role || "cliente",
        hospitals: assignments?.filter((a) => a.user_id === p.user_id) || [],
      }));
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (payload: { email: string; password: string; full_name: string; role: string; hospital_ids?: string[] }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await supabase.functions.invoke("create-user", { body: payload });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed_users"] });
      toast({ title: "Usuário criado com sucesso!" });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar usuário", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("cliente");
    setHospitalIds([]);
  };

  const toggleHospital = (id: string) => {
    setHospitalIds((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "controlador" && hospitalIds.length === 0) {
      toast({ title: "Selecione pelo menos um hospital", variant: "destructive" });
      return;
    }
    createUserMutation.mutate({
      email,
      password,
      full_name: fullName,
      role,
      hospital_ids: role === "controlador" ? hospitalIds : undefined,
    });
  };

  const roleBadge = (role: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      admin: { label: "Administrador", variant: "default" },
      controlador: { label: "Controlador", variant: "secondary" },
      cliente: { label: "Visualizador", variant: "outline" },
    };
    const r = map[role] || map.cliente;
    return <Badge variant={r.variant}>{r.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Usuários cadastrados</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar novo usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome completo</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome do usuário" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@exemplo.com" />
              </div>
              <div>
                <Label>Senha *</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <Label>Perfil *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Visualizador (Cliente)</SelectItem>
                    <SelectItem value="controlador">Controlador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {role === "controlador" && (
                <div>
                  <Label>Hospitais atribuídos *</Label>
                  <p className="text-xs text-muted-foreground mb-2">Selecione um ou mais hospitais</p>
                  <div className="border rounded-md p-3 max-h-56 overflow-y-auto space-y-2">
                    {hospitals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum hospital cadastrado</p>
                    ) : (
                      hospitals.map((h) => (
                        <label key={h.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={hospitalIds.includes(h.id)}
                            onCheckedChange={() => toggleHospital(h.id)}
                          />
                          <span>{h.short_name} - {h.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Hospitais</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : users.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum usuário cadastrado</TableCell></TableRow>
          ) : (
            users.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell>{u.full_name || "—"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{roleBadge(u.role)}</TableCell>
                <TableCell>
                  {u.hospitals.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.hospitals.map((a: any) => (
                        <Badge key={a.id} variant="outline" className="text-xs">
                          {a.hospitals?.short_name || "—"}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagement;
