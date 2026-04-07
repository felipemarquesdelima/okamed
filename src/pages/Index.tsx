import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import DashboardHeader from "@/components/DashboardHeader";
import FilterBar from "@/components/FilterBar";
import StatsCards from "@/components/StatsCards";
import DashboardTabs from "@/components/DashboardTabs";
import AlertStatus from "@/components/AlertStatus";
import AdminPanel from "@/components/AdminPanel";
import LoginPage from "./LoginPage";
import { getMonthlyData, getStats } from "@/lib/mockData";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string>("cliente");
  const [showLogin, setShowLogin] = useState(false);
  const [showManagement, setShowManagement] = useState(false);

  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedServices, setSelectedServices] = useState(["corretiva"]);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState("Todos os meses");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowLogin(false);
        setTimeout(async () => {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();
          setUserRole(data?.role || "cliente");
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            setUserRole(data?.role || "cliente");
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole("cliente");
    setShowManagement(false);
  };

  const handleServiceToggle = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  if (showLogin) {
    return <LoginPage onBack={() => setShowLogin(false)} />;
  }

  // Use a fallback hospital id for mock data
  const hospitalKey = selectedHospital ? "hc" : "hc";
  const monthlyData = getMonthlyData(hospitalKey);
  const stats = getStats(hospitalKey);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        isLoggedIn={!!session}
        userRole={userRole}
        onLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
        onManageHospitals={() => setShowManagement(!showManagement)}
      />
      <main className="container mx-auto px-4 py-6 space-y-4">
        {showManagement && userRole === "admin" && <HospitalManagement />}
        <FilterBar
          selectedHospital={selectedHospital}
          onHospitalChange={setSelectedHospital}
          selectedServices={selectedServices}
          onServiceToggle={handleServiceToggle}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
        <StatsCards
          totalAbertas={stats.totalAbertas}
          totalFinalizadas={stats.totalFinalizadas}
          taxaConclusao={stats.taxaConclusao}
          acumCritico={stats.acumCritico}
        />
        <DashboardTabs data={monthlyData} hospitalId={hospitalKey} />
        <AlertStatus acumCritico={stats.acumCritico} />
      </main>
    </div>
  );
};

export default Index;
