import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, ClipboardList, Home, Users } from "lucide-react";
import HospitalManagement from "./HospitalManagement";
import ServiceOrderManagement from "./ServiceOrderManagement";
import UserManagement from "./UserManagement";

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
        <TabsList className="mb-4">
          <TabsTrigger value="home" onClick={onHome} className="gap-1.5">
            <Home className="h-4 w-4" />
            Página inicial
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="hospitals" className="gap-1.5">
              <Building2 className="h-4 w-4" />
              Hospitais
            </TabsTrigger>
          )}
          <TabsTrigger value="os-data" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Dados de OS
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-4 w-4" />
              Usuários
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
      </Tabs>
    </div>
  );
};

export default AdminPanel;
