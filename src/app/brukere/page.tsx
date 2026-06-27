import { getAuthContext } from "@/lib/auth";
import { roleLabels, getInitials, formatDate } from "@/lib/config";
import { Users, Shield, Mail, Phone, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviterBrukerDialog, RolleSelect, FjernBrukerButton } from "@/components/brukere/BrukereDialogs";
import { redirect } from "next/navigation";

const rolePriority: Record<string, number> = {
  styreleder: 0, styremedlem: 1, varamedlem: 2, vaktmester: 3, beboer: 4, ekstern: 5,
};

const roleColor: Record<string, string> = {
  styreleder: "bg-violet-500/20 text-violet-400",
  styremedlem: "bg-blue-500/20 text-blue-400",
  varamedlem: "bg-teal-500/20 text-teal-400",
  vaktmester: "bg-amber-500/20 text-amber-400",
  beboer: "bg-zinc-500/20 text-zinc-400",
  ekstern: "bg-zinc-500/20 text-zinc-500",
};

export default async function BrukerePage() {
  const { supabase, tenantId, profileId, role } = await getAuthContext();

  // Only styreleder can access this page
  if (role !== "styreleder") redirect("/");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .eq("tenant_id", tenantId)
    .order("role")
    .order("full_name");

  const users = (profiles || []).sort(
    (a, b) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99)
  );

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Brukere</h1>
          <p className="text-sm text-zinc-500 mt-1">Administrer brukere og roller</p>
        </div>
        <InviterBrukerDialog />
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        {Object.entries(rolePriority).filter(([r]) => r !== "ekstern").map(([r]) => (
          <Card key={r} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-zinc-100">{roleCounts[r] || 0}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{roleLabels[r] || r}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User List */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <Users className="w-4 h-4 inline-block mr-1.5" />
          Alle brukere ({users.length})
        </h2>
        <div className="space-y-2">
          {users.map((user) => {
            const isCurrentUser = user.id === profileId;
            const rc = roleColor[user.role] || roleColor.beboer;

            return (
              <div
                key={user.id}
                className={`bg-zinc-900 border rounded-xl p-4 ${
                  isCurrentUser ? "border-violet-900/50" : "border-zinc-800"
                }`}
              >
                {/* Top row: avatar + info */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                    isCurrentUser ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {getInitials(user.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {user.full_name || "Uten navn"}
                      </p>
                      <Badge variant="secondary" className={`${rc} text-[10px] px-1.5 py-0`}>
                        {roleLabels[user.role] || user.role}
                      </Badge>
                      {isCurrentUser && (
                        <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">Du</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 flex-wrap">
                      {user.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[160px] sm:max-w-none">{user.email}</span>
                        </span>
                      )}
                      {user.phone && (
                        <span className="hidden sm:flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </span>
                      )}
                      <span className="hidden sm:flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.created_at, { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom row: actions (stacked on mobile) */}
                <div className="flex items-center gap-2 mt-3 sm:mt-2 pl-[52px]">
                  <RolleSelect
                    profileId={user.id}
                    currentRole={user.role}
                    isCurrentUser={isCurrentUser}
                  />
                  {!isCurrentUser && (
                    <FjernBrukerButton profileId={user.id} name={user.full_name || "bruker"} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Info box */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-zinc-500 space-y-1">
              <p>Kun styreleder kan administrere brukere og endre roller.</p>
              <p>Inviterte brukere får tilsendt innloggingsinformasjon via e-post når service-nøkkel er konfigurert.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
