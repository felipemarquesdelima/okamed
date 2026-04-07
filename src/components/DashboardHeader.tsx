import { LogOut, Download, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  isLoggedIn: boolean;
  userRole?: string;
  onLogin: () => void;
  onLogout: () => void;
}

const DashboardHeader = ({ isLoggedIn, userRole, onLogin, onLogout }: DashboardHeaderProps) => {
  return (
    <header className="gradient-header px-4 py-4 md:px-8">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">+</span>
            </div>
            <div>
              <h1 className="text-primary-foreground text-lg md:text-xl font-bold">Painel de Indicadores</h1>
              <p className="text-primary-foreground/70 text-xs">Complexo de Saúde</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20"
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="text-primary-foreground/80 text-xs hidden md:inline">
                {userRole === "admin" ? "Administrador" : "Cliente"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogin}
              className="border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
