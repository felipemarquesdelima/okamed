import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SiteSettings = () => {
  const [goal, setGoal] = useState(90);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["site_settings", "goal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("goal_percent").eq("id", true).single();
      if (error) throw error;
      return Number(data.goal_percent);
    },
  });

  useEffect(() => {
    if (data !== undefined) setGoal(data);
  }, [data]);

  const updateGoal = useMutation({
    mutationFn: async () => {
      if (!Number.isFinite(goal) || goal < 0 || goal > 100) throw new Error("Informe uma meta entre 0 e 100%.");
      const { error } = await supabase.from("site_settings").update({ goal_percent: goal }).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_settings", "goal"] });
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
      queryClient.invalidateQueries({ queryKey: ["service_orders_dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["service_orders_charts"] });
      toast({ title: "Meta geral atualizada", description: `A nova meta de ${goal}% foi aplicada a todas as OS.` });
    },
    onError: (error: Error) => toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-md space-y-5">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Configurações do site</h3>
      </div>
      <div className="space-y-2">
        <Label htmlFor="global-goal">Meta geral (%)</Label>
        <Input id="global-goal" type="number" min={0} max={100} value={goal} disabled={isLoading} onChange={(event) => setGoal(Number(event.target.value))} />
        <p className="text-xs text-muted-foreground">Esta meta é aplicada a todos os hospitais, serviços e períodos.</p>
      </div>
      <Button onClick={() => updateGoal.mutate()} disabled={isLoading || updateGoal.isPending}>
        {updateGoal.isPending ? "Salvando..." : "Salvar meta geral"}
      </Button>
    </div>
  );
};

export default SiteSettings;