import { getAuthContext } from "@/lib/auth";
import { formatDate, formatCost, roleLabels } from "@/lib/config";
import {
  Home, Building2, MapPin, Calendar, Key, Shield,
  Ruler, Layers, CalendarDays, Wrench, CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function BoligerPage() {
  const { supabase, userId, profileId, tenantId } = await getAuthContext();

  // Hent alle profiler brukeren har (multi-tenant støtte)
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, tenant_id, role, tenants(*)")
    .eq("user_id", userId);

  const profiles = allProfiles || [];

  // Hent alle enheter brukeren eier
  const { data: ownerships } = await supabase
    .from("unit_owners")
    .select("*, units(*)")
    .eq("profile_id", profileId);

  const units = ownerships || [];

  // Hent nøkler tildelt brukeren
  const { data: keys } = await supabase
    .from("key_register")
    .select("id, key_type, label, serial_number, issued_at")
    .eq("tenant_id", tenantId)
    .eq("assigned_to", profileId)
    .is("returned_at", null);

  // Hent kommende bookinger for brukeren
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, date, time_from, time_to, purpose, booking_resources!bookings_resource_id_fkey(name)")
    .eq("tenant_id", tenantId)
    .eq("booked_by", profileId)
    .eq("status", "bekreftet")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date")
    .limit(5);

  // Hent vedlikeholdstiltak som gjelder i år
  const { data: maintenance } = await supabase
    .from("maintenance_items")
    .select("id, building_part, condition, next_maintenance_at")
    .eq("tenant_id", tenantId)
    .order("next_maintenance_at");

  const upcomingMaintenance = (maintenance || []).filter(m =>
    m.next_maintenance_at && new Date(m.next_maintenance_at).getFullYear() === new Date().getFullYear()
  );

  // Hent forsikringsstatus
  const { data: insurance } = await supabase
    .from("insurance_policies")
    .select("id, type, provider, valid_to, status")
    .eq("tenant_id", tenantId)
    .eq("status", "aktiv");

  const keyTypeLabels: Record<string, string> = {
    hovednokkel: "Hovednøkkel", systemnokkel: "Systemnøkkel", brikke: "Brikke", kode: "Kode",
  };

  const conditionLabels: Record<string, { label: string; color: string }> = {
    god: { label: "God", color: "text-emerald-400" },
    akseptabel: { label: "Akseptabel", color: "text-amber-400" },
    darlig: { label: "Dårlig", color: "text-red-400" },
    kritisk: { label: "Kritisk", color: "text-red-300" },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Mine boliger</h1>
        <p className="text-sm text-zinc-500 mt-1">Oversikt over dine boliger og tilknyttede sameier</p>
      </div>

      {/* Sameier brukeren tilhører */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <Building2 className="w-4 h-4 inline-block mr-1.5" />
          Mine sameier ({profiles.length})
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {profiles.map(p => {
            const tenant = (p as any).tenants;
            if (!tenant) return null;
            const isActive = p.tenant_id === tenantId;
            return (
              <Card key={p.id} className={`border ${isActive ? "bg-violet-950/20 border-violet-900/50" : "bg-zinc-900 border-zinc-800"}`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-violet-500/20" : "bg-zinc-800"}`}>
                      <Building2 className={`w-5 h-5 ${isActive ? "text-violet-400" : "text-zinc-500"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-100 truncate">{tenant.name}</p>
                        {isActive && <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">Aktiv</span>}
                      </div>
                      <p className="text-xs text-zinc-500">
                        <Badge variant="secondary" className="bg-zinc-700/50 text-zinc-300 text-[10px] px-1.5 py-0 mr-2">
                          {roleLabels[p.role] || p.role}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-zinc-500">
                    {tenant.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {tenant.address}{tenant.zip ? `, ${tenant.zip}` : ""} {tenant.city || ""}
                      </span>
                    )}
                    {tenant.num_units && <span>{tenant.num_units} enheter</span>}
                    {tenant.year_built && <span> · Bygget {tenant.year_built}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Mine enheter */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <Home className="w-4 h-4 inline-block mr-1.5" />
          Mine enheter ({units.length})
        </h2>
        {units.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {units.map(ownership => {
              const unit = (ownership as any).units;
              if (!unit) return null;
              return (
                <Card key={ownership.id} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Home className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{unit.unit_number}</p>
                        {unit.unit_type && <p className="text-xs text-zinc-500">{unit.unit_type}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {unit.size_sqm && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Ruler className="w-3.5 h-3.5 text-zinc-600" />
                          <span>{unit.size_sqm} m²</span>
                        </div>
                      )}
                      {unit.floor && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Layers className="w-3.5 h-3.5 text-zinc-600" />
                          <span>{unit.floor}. etasje</span>
                        </div>
                      )}
                      {ownership.moved_in_at && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Innflyttet {formatDate(ownership.moved_in_at, { month: "short", year: "numeric" })}</span>
                        </div>
                      )}
                      {ownership.is_primary && (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Primærbolig</span>
                        </div>
                      )}
                    </div>
                    {unit.notes && (
                      <p className="text-xs text-zinc-500 mt-3 bg-zinc-800/50 rounded-lg px-3 py-2">{unit.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center">
              <Home className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Ingen enheter registrert på deg</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Nøkler */}
      {keys && keys.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
            <Key className="w-4 h-4 inline-block mr-1.5" />
            Mine nøkler ({keys.length})
          </h2>
          <div className="space-y-2">
            {keys.map(key => (
              <div key={key.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{key.label}</p>
                  <p className="text-xs text-zinc-500">
                    {keyTypeLabels[key.key_type] || key.key_type}
                    {key.serial_number && ` · ${key.serial_number}`}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">Utlevert</Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Kommende bookinger */}
      {bookings && bookings.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
            <CalendarDays className="w-4 h-4 inline-block mr-1.5" />
            Mine bookinger
          </h2>
          <div className="space-y-2">
            {bookings.map(b => (
              <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{(b as any).booking_resources?.name || "Ressurs"}</p>
                  <p className="text-xs text-zinc-500">
                    {formatDate(b.date, { weekday: "short", day: "numeric", month: "short" })} · {b.time_from?.slice(0, 5)}–{b.time_to?.slice(0, 5)}
                    {b.purpose && ` · ${b.purpose}`}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">Bekreftet</Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bygningsstatus */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <Wrench className="w-4 h-4 inline-block mr-1.5" />
          Bygningsstatus
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Vedlikehold */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <Wrench className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-medium text-zinc-200">Vedlikehold i år</h3>
              </div>
              {upcomingMaintenance.length > 0 ? (
                <div className="space-y-2">
                  {upcomingMaintenance.slice(0, 4).map(m => {
                    const cond = conditionLabels[m.condition] || conditionLabels.god;
                    return (
                      <div key={m.id} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 truncate">{m.building_part}</span>
                        <span className={cond.color}>{cond.label}</span>
                      </div>
                    );
                  })}
                  {upcomingMaintenance.length > 4 && (
                    <p className="text-xs text-zinc-600">+{upcomingMaintenance.length - 4} til</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">Ingen tiltak planlagt i år</p>
              )}
            </CardContent>
          </Card>

          {/* Forsikring */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-medium text-zinc-200">Forsikring</h3>
              </div>
              {insurance && insurance.length > 0 ? (
                <div className="space-y-2">
                  {insurance.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300">{p.provider}</span>
                      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-[10px]">Aktiv</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">Ingen forsikringsinfo tilgjengelig</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
