import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, KeyRound, Trash2, Search, History, Building2 } from "lucide-react";
import { format } from "date-fns";

type ManagedUser = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  active: boolean;
  force_password_change: boolean;
  created_at: string;
  role: string;
  hospitals: Array<{ id: string; hospital_id: string; hospitals: { short_name: string; name: string } | null }>;
};

const roleLabel = (role: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    admin: { label: "Administrador", variant: "default" },
    controlador: { label: "Controlador", variant: "secondary" },
    cliente: { label: "Visualizador", variant: "outline" },
  };
  const r = map[role] || map.cliente;
  return <Badge variant={r.variant}>{r.label}</Badge>;
};

const genTempPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd + "!";
};

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filtros
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Criar
  const [createOpen, setCreateOpen] = useState(false);
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cFullName, setCFullName] = useState("");
  const [cRole, setCRole] = useState("cliente");
  const [cHospitalIds, setCHospitalIds] = useState<string[]>([]);

  // Editar
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [eFullName, setEFullName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [eRole, setERole] = useState("cliente");
  const [eActive, setEActive] = useState(true);
  const [eHospitalIds, setEHospitalIds] = useState<string[]>([]);

  // Redefinir senha
  const [pwdUser, setPwdUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [forceChange, setForceChange] = useState(true);

  // Excluir
  const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null);

  // Auditoria
  const [auditOpen, setAuditOpen] = useState(false);

  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals_all"],
    queryFn: async () => {
      const { data } = await supabase.from("hospitals").select("*").order("short_name");
      return data || [];
    },
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["managed_users"],
    queryFn: async (): Promise<ManagedUser[]> => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (!profiles) return [];
      const userIds = profiles.map((p) => p.user_id);
      const { data: roles } = await supabase.from("user_roles").select("*").in("user_id", userIds);
      const { data: assignments } = await supabase
        .from("user_hospital_assignments")
        .select("*, hospitals(short_name, name)")
        .in("user_id", userIds);
      return profiles.map((p: any) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.user_id)?.role || "cliente",
        hospitals: assignments?.filter((a) => a.user_id === p.user_id) || [],
      }));
    },
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["user_audit_logs"],
    enabled: auditOpen,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase();
      if (q && !(u.email.toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q))) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && !u.active) return false;
      if (statusFilter === "inactive" && u.active) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["managed_users"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await supabase.functions.invoke("create-user", {
        body: {
          email: cEmail,
          password: cPassword,
          full_name: cFullName,
          role: cRole,
          hospital_ids: cRole === "controlador" ? cHospitalIds : undefined,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso!" });
      setCreateOpen(false);
      setCEmail(""); setCPassword(""); setCFullName(""); setCRole("cliente"); setCHospitalIds([]);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const callManage = async (body: Record<string, unknown>) => {
    const res = await supabase.functions.invoke("manage-user", { body });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const saveEditMutation = useMutation({
    mutationFn: async () => {
      if (!editUser) return;
      await callManage({
        action: "update_profile",
        user_id: editUser.user_id,
        full_name: eFullName,
        email: eEmail,
        active: eActive,
      });
      if (eRole !== editUser.role) {
        await callManage({ action: "update_role", user_id: editUser.user_id, role: eRole });
      }
      const currentIds = editUser.hospitals.map((h) => h.hospital_id).sort().join(",");
      const newIds = [...eHospitalIds].sort().join(",");
      if (currentIds !== newIds) {
        await callManage({ action: "update_hospitals", user_id: editUser.user_id, hospital_ids: eHospitalIds });
      }
    },
    onSuccess: () => {
      toast({ title: "Usuário atualizado" });
      setEditUser(null);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetPwdMutation = useMutation({
    mutationFn: async () => {
      if (!pwdUser) return;
      await callManage({
        action: "reset_password",
        user_id: pwdUser.user_id,
        password: newPassword,
        force_change: forceChange,
      });
    },
    onSuccess: () => {
      toast({ title: "Senha redefinida", description: `Nova senha: ${newPassword}` });
      setPwdUser(null);
      setNewPassword("");
      setForceChange(true);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteUser) return;
      await callManage({ action: "delete_user", user_id: deleteUser.user_id });
    },
    onSuccess: () => {
      toast({ title: "Usuário excluído" });
      setDeleteUser(null);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openEdit = (u: ManagedUser) => {
    setEditUser(u);
    setEFullName(u.full_name || "");
    setEEmail(u.email);
    setERole(u.role);
    setEActive(u.active);
    setEHospitalIds(u.hospitals.map((h) => h.hospital_id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Gestão de Usuários</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAuditOpen(true)}>
            <History className="h-4 w-4" /> Auditoria
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Novo Usuário</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Criar novo usuário</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
                <div><Label>Nome completo</Label><Input value={cFullName} onChange={(e) => setCFullName(e.target.value)} /></div>
                <div><Label>Email *</Label><Input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} required /></div>
                <div>
                  <Label>Senha *</Label>
                  <div className="flex gap-2">
                    <Input type="text" value={cPassword} onChange={(e) => setCPassword(e.target.value)} required minLength={6} />
                    <Button type="button" variant="outline" onClick={() => setCPassword(genTempPassword())}>Gerar</Button>
                  </div>
                </div>
                <div>
                  <Label>Perfil *</Label>
                  <Select value={cRole} onValueChange={setCRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Visualizador (Cliente)</SelectItem>
                      <SelectItem value="controlador">Controlador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {cRole === "controlador" && (
                  <div>
                    <Label>Hospitais atribuídos *</Label>
                    <div className="border rounded-md p-3 max-h-56 overflow-y-auto space-y-2 mt-1">
                      {hospitals.filter((h: any) => h.active).map((h: any) => (
                        <label key={h.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={cHospitalIds.includes(h.id)}
                            onCheckedChange={() => setCHospitalIds((p) => p.includes(h.id) ? p.filter((x) => x !== h.id) : [...p, h.id])}
                          />
                          <span>{h.short_name} - {h.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Usuário"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os perfis</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="controlador">Controlador</SelectItem>
            <SelectItem value="cliente">Visualizador</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Hospitais</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : filteredUsers.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
          ) : (
            filteredUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.full_name || "—"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{roleLabel(u.role)}</TableCell>
                <TableCell>
                  {u.hospitals.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.hospitals.map((a) => (
                        <Badge key={a.id} variant="outline" className="text-xs">
                          {a.hospitals?.short_name || "—"}
                        </Badge>
                      ))}
                    </div>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={u.active ? "default" : "secondary"} className={u.active ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
                    {u.active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" title="Editar" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Redefinir senha" onClick={() => setPwdUser(u)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Excluir" onClick={() => setDeleteUser(u)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Editar */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar usuário</DialogTitle></DialogHeader>
          {editUser && (
            <Tabs defaultValue="info">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="hospitals" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Hospitais</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 pt-3">
                <div><Label>Nome completo</Label><Input value={eFullName} onChange={(e) => setEFullName(e.target.value)} /></div>
                <div><Label>Email</Label><Input type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} /></div>
                <div>
                  <Label>Perfil</Label>
                  <Select value={eRole} onValueChange={setERole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Visualizador (Cliente)</SelectItem>
                      <SelectItem value="controlador">Controlador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <Label className="cursor-pointer">Usuário ativo</Label>
                    <p className="text-xs text-muted-foreground">Desativar bloqueia o login mas mantém o histórico.</p>
                  </div>
                  <Switch checked={eActive} onCheckedChange={setEActive} />
                </div>
              </TabsContent>
              <TabsContent value="hospitals" className="pt-3">
                <Label>Hospitais vinculados</Label>
                <p className="text-xs text-muted-foreground mb-2">Aplica-se principalmente ao perfil Controlador.</p>
                <div className="border rounded-md p-3 max-h-72 overflow-y-auto space-y-2">
                  {hospitals.map((h: any) => (
                    <label key={h.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={eHospitalIds.includes(h.id)}
                        onCheckedChange={() => setEHospitalIds((p) => p.includes(h.id) ? p.filter((x) => x !== h.id) : [...p, h.id])}
                      />
                      <span>{h.short_name} - {h.name}</span>
                      {!h.active && <Badge variant="outline" className="text-xs ml-1">inativo</Badge>}
                    </label>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={() => saveEditMutation.mutate()} disabled={saveEditMutation.isPending}>
              {saveEditMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redefinir senha */}
      <Dialog open={!!pwdUser} onOpenChange={(o) => !o && setPwdUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>{pwdUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Nova senha</Label>
            <div className="flex gap-2">
              <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              <Button type="button" variant="outline" onClick={() => setNewPassword(genTempPassword())}>Gerar temporária</Button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm pt-2">
              <Checkbox checked={forceChange} onCheckedChange={(v) => setForceChange(!!v)} />
              <span>Forçar alteração no próximo login</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdUser(null)}>Cancelar</Button>
            <Button onClick={() => resetPwdMutation.mutate()} disabled={resetPwdMutation.isPending || newPassword.length < 6}>
              {resetPwdMutation.isPending ? "Salvando..." : "Redefinir senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excluir */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente <strong>{deleteUser?.email}</strong>. Para preservar o histórico, prefira desativar o usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auditoria */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Auditoria de usuários</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Realizado por</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem registros</TableCell></TableRow>
              ) : auditLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs whitespace-nowrap">{format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                  <TableCell className="text-xs">{log.actor_email || "—"}</TableCell>
                  <TableCell className="text-xs">{log.target_email || log.target_user_id?.slice(0, 8) || "—"}</TableCell>
                  <TableCell className="text-xs"><code className="text-[10px]">{log.details ? JSON.stringify(log.details) : "—"}</code></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
