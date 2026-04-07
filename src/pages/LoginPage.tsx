import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";

interface LoginPageProps {
  onBack: () => void;
}

const LoginPage = ({ onBack }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Login realizado com sucesso!" });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl gradient-header flex items-center justify-center">
            <LogIn className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">{isSignUp ? "Criar Conta" : "Entrar"}</CardTitle>
          <CardDescription>
            {isSignUp ? "Crie sua conta para acessar o painel" : "Acesse o painel de indicadores"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : isSignUp ? "Criar Conta" : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar"}
            </button>
            <br />
            <button onClick={onBack} className="text-sm text-muted-foreground hover:underline">
              Voltar ao painel
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
