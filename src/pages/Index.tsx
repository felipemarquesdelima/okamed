import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import DashboardHeader from "@/components/DashboardHeader";
import FilterBar from "@/components/FilterBar";
import StatsCards from "@/components/StatsCards";
import DashboardTabs from "@/components/DashboardTabs";
import AlertStatus from "@/components/AlertStatus";
import AdminPanel from "@/components/AdminPanel";
import LoginPage from "./LoginPage";
import { MonthlyData, getMonthlyData, getStats } from "@/lib/mockData";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string>("cliente");
  const [showLogin, setShowLogin] = useState(false);
  const [showManagement, setShowManagement] = useState(false);

  const [selectedHospital, setSelectedHospital] = useState("all");
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

  // Fetch real OS data from database
  const { data: dbOrders = [] } = useQuery({
    queryKey: ["service_orders_dashboard", selectedHospital, selectedYear, selectedServices],
    queryFn: async () => {
      let query = supabase
        .from("service_orders")
        .select("*")
        .eq("year", selectedYear);
      if (selectedHospital && selectedHospital !== "all") {
        query = query.eq("hospital_id", selectedHospital);
      }
      if (selectedServices.length > 0) {
        query = query.in("service_type", selectedServices);
      }
      const { data, error } = await query.order("month");
      if (error) throw error;
      return data || [];
    },
  });

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

  // Build monthly data from DB orders, grouped by month
  const monthlyData: MonthlyData[] = MONTHS.map((monthName, i) => {
    const monthOrders = dbOrders.filter((o: any) => o.month === i + 1);
    if (monthOrders.length === 0) {
      return {
        month: monthName,
        osAbertas: 0,
        osFinalizadas: 0,
        percentual: 0,
        meta: 90,
        acumCritico: 0,
        acumGeral: 0,
        analiseCritica: "—",
      };
    }
    const osAbertas = monthOrders.reduce((s: number, o: any) => s + o.os_abertas, 0);
    const osFinalizadas = monthOrders.reduce((s: number, o: any) => s + o.os_finalizadas, 0);
    const acumCritico = monthOrders.reduce((s: number, o: any) => s + o.acum_critico, 0);
    const acumGeral = monthOrders.reduce((s: number, o: any) => s + o.acum_geral, 0);
    const meta = Number(monthOrders[0]?.meta || 90);
    const percentual = osAbertas > 0 ? Math.round((osFinalizadas / osAbertas) * 1000) / 10 : 0;
    const analiseCritica = monthOrders.map((o: any) => o.analise_critica).filter((a: string) => a && a !== "—").join(" | ") || "—";
    return { month: monthName, osAbertas, osFinalizadas, percentual, meta, acumCritico, acumGeral, analiseCritica };
  });

  const activeMonths = monthlyData.filter(d => d.osAbertas > 0);
  const totalAbertas = activeMonths.reduce((s, d) => s + d.osAbertas, 0);
  const totalFinalizadas = activeMonths.reduce((s, d) => s + d.osFinalizadas, 0);
  const taxaConclusao = totalAbertas > 0 ? Math.round((totalFinalizadas / totalAbertas) * 1000) / 10 : 0;
  const acumCritico = activeMonths.reduce((s, d) => s + d.acumCritico, 0);
  const stats = { totalAbertas, totalFinalizadas, taxaConclusao, acumCritico };

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
        {showManagement && (userRole === "admin" || userRole === "controlador") && <AdminPanel userRole={userRole} />}
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
        <DashboardTabs data={monthlyData} hospitalId={selectedHospital || "all"} selectedYear={selectedYear} selectedServices={selectedServices} />
        <AlertStatus acumCritico={stats.acumCritico} />
      </main>
    </div>
  );
};

export default Index;
