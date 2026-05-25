import { LogOut, Download, LogIn, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import okamedLogo from "@/assets/okamed-logo.jpeg";

interface DashboardHeaderProps {
  isLoggedIn: boolean;
  userRole?: string;
  onLogin: () => void;
  onLogout: () => void;
  onManageHospitals?: () => void;
}

const DashboardHeader = ({ isLoggedIn, userRole, onLogin, onLogout, onManageHospitals }: DashboardHeaderProps) => {
  return (
    <header className="gradient-header px-4 py-4 md:px-8">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 rounded-lg bg-primary-foreground flex items-center justify-center px-3 py-1.5">
              <img src={okamedLogo} alt="OKAMED - Tecnologia Hospitalar" className="h-full w-auto object-contain" />
            </div>
            <div className="hidden md:block border-l border-primary-foreground/30 h-8 mx-1" />
            <div className="hidden md:block">
              <h1 className="text-primary-foreground text-lg font-bold">Painel de Indicadores</h1>
              <p className="text-primary-foreground/70 text-xs">Complexo de Saúde</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn && (userRole === "admin" || userRole === "controlador") && onManageHospitals && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageHospitals}
              className="border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20"
            >
              <Settings className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Gerenciar</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20"
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Exportar</span>
          </Button>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="text-primary-foreground/80 text-xs hidden lg:inline">
                {userRole === "admin" ? "Administrador" : userRole === "controlador" ? "Controlador" : "Visualizador"}
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
