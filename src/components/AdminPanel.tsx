import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, ClipboardList, Users } from "lucide-react";
import HospitalManagement from "./HospitalManagement";
import ServiceOrderManagement from "./ServiceOrderManagement";
import UserManagement from "./UserManagement";

const AdminPanel = () => {
  return (
    <div className="bg-card rounded-xl p-5 stat-card-shadow">
      <Tabs defaultValue="hospitals" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="hospitals" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            Hospitais
          </TabsTrigger>
          <TabsTrigger value="os-data" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Dados de OS
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </TabsList>
        <TabsContent value="hospitals">
          <HospitalManagement />
        </TabsContent>
        <TabsContent value="os-data">
          <ServiceOrderManagement />
        </TabsContent>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
