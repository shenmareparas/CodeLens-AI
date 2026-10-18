import { useAuth } from "@/context/AuthContext";
import { DashboardClient } from "@/components/DashboardClient";

export function DashboardPage() {
  const { user, backendToken, logout } = useAuth();

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)" }}>
      <DashboardClient
        userName={user?.name}
        userEmail={user?.email}
        userAvatar={user?.avatarUrl}
        backendToken={backendToken ?? ""}
        onLogout={logout}
      />
    </main>
  );
}

export default DashboardPage;
