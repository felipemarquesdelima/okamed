import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, ClipboardList, Home, Settings, Users } from "lucide-react";
import HospitalManagement from "./HospitalManagement";
import ServiceOrderManagement from "./ServiceOrderManagement";
import UserManagement from "./UserManagement";
import SiteSettings from "./SiteSettings";

interface AdminPanelProps {
  userRole?: string;
  onHome: () => void;
}

const AdminPanel = ({ userRole = "admin", onHome }: AdminPanelProps) => {
  const isAdmin = userRole === "admin";
  const defaultTab = isAdmin ? "hospitals" : "os-data";

  return (
    <div className="bg-card rounded-xl p-5 stat-card-shadow">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="home" onClick={onHome} className="shrink-0 gap-1.5">
            <Home className="h-4 w-4" />
            Página inicial
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="hospitals" className="shrink-0 gap-1.5">
              <Building2 className="h-4 w-4" />
              Hospitais
            </TabsTrigger>
          )}
          <TabsTrigger value="os-data" className="shrink-0 gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Dados de OS
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="shrink-0 gap-1.5">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="settings" className="shrink-0 gap-1.5">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          )}
        </TabsList>
        {isAdmin && (
          <TabsContent value="hospitals">
            <HospitalManagement />
          </TabsContent>
        )}
        <TabsContent value="os-data">
          <ServiceOrderManagement userRole={userRole} />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="settings">
            <SiteSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AdminPanel;
