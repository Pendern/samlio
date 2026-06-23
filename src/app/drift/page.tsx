import { getAuthContext } from "@/lib/auth";
import {
  formatCost, formatDate, isOverdue,
  insuranceStatusConfig, insuranceTypeLabels,
  bookingStatusConfig, keyTypeLabels, supplierCategoryLabels,
} from "@/lib/config";
import {
  Shield, Key, CalendarDays, Truck,
  Phone, Mail, Star, MapPin, Clock,
  AlertTriangle, CheckCircle2, User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NyLeverandorDialog, NyBookingDialog, CancelBookingButton } from "@/components/drift/DriftDialogs";

export default async function DriftPage() {
  const { supabase, tenantId } = await getAuthContext();

  const [insuranceRes, keysRes, resourcesRes, bookingsRes, suppliersRes] = await Promise.all([
    supabase.from("insurance_policies").select("*").eq("tenant_id", tenantId).order("valid_to", { ascending: false }),
    supabase.from("key_register").select("*, profiles!key_register_assigned_to_fkey(full_name)").eq("tenant_id", tenantId).order("created_at"),
    supabase.from("booking_resources").select("*").eq("tenant_id", tenantId).order("name"),
    supabase.from("bookings").select("*, profiles!bookings_booked_by_fkey(full_name), booking_resources!bookings_resource_id_fkey(name)").eq("tenant_id", tenantId).order("date"),
    supabase.from("suppliers").select("*").eq("tenant_id", tenantId).order("name"),
  ]);

  const insurance = insuranceRes.data || [];
  const keys = keysRes.data || [];
  const resources = resourcesRes.data || [];
  const bookings = bookingsRes.data || [];
  const suppliers = suppliersRes.data || [];

  const activeInsurance = insurance.filter(i => i.status === "aktiv");
  const totalPremium = activeInsurance.reduce((sum, i) => sum + (Number(i.annual_premium) || 0), 0);
  const activeKeys = keys.filter(k => !k.returned_at);
  const upcomingBookings = bookings.filter(b => b.status === "bekreftet" && new Date(b.date) >= new Date());

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Drift</h1>
        <p className="text-sm text-zinc-500 mt-1">Forsikring, nøkler, booking og leverandører</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{activeInsurance.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Aktive poliser</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-zinc-100">{activeKeys.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Utleverte nøkler</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{upcomingBookings.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Kommende bookinger</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{suppliers.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Leverandører</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Forsikring ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <Shield className="w-4 h-4 inline-block mr-1.5" />
          Forsikring ({activeInsurance.length} aktive · {formatCost(totalPremium)}/år)
        </h2>
        <div className="space-y-3">
          {insurance.map(policy => {
            const status = insuranceStatusConfig[policy.status] || insuranceStatusConfig.aktiv;
            const typeLabel = insuranceTypeLabels[policy.type] || policy.type;
            const expiring = policy.status === "aktiv" && new Date(policy.valid_to) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
            const expired = isOverdue(policy.valid_to);

            return (
              <div key={policy.id} className={`bg-zinc-900 border rounded-xl p-5 ${expired && policy.status === "aktiv" ? "border-red-900/50" : "border-zinc-800"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-zinc-100">{typeLabel}</h3>
                      <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                      {expiring && !expired && <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">Utløper snart</Badge>}
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">{policy.provider} · {policy.policy_number}</p>
                  </div>
                  {policy.coverage_amount && (
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-lg font-bold text-zinc-200">{formatCost(Number(policy.coverage_amount))}</p>
                      <p className="text-xs text-zinc-500">dekning</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-6 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(policy.valid_from, { day: "numeric", month: "short", year: "numeric" })} — {formatDate(policy.valid_to, { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {policy.annual_premium && (
                    <span>{formatCost(Number(policy.annual_premium))}/år</span>
                  )}
                  {policy.contact_person && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {policy.contact_person} {policy.contact_phone && `· ${policy.contact_phone}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {insurance.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <Shield className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Ingen forsikringspoliser registrert</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Nøkkelregister ─────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <Key className="w-4 h-4 inline-block mr-1.5" />
          Nøkkelregister ({activeKeys.length} utlevert)
        </h2>
        <div className="space-y-2">
          {keys.map(key => {
            const typeLabel = keyTypeLabels[key.key_type] || key.key_type;
            const isReturned = !!key.returned_at;
            return (
              <div key={key.id} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 ${isReturned ? "opacity-60" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isReturned ? "bg-zinc-800" : "bg-amber-500/20"}`}>
                  <Key className={`w-4 h-4 ${isReturned ? "text-zinc-500" : "text-amber-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{key.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {typeLabel}
                    {key.serial_number && ` · ${key.serial_number}`}
                    {key.issued_at && ` · Utlevert ${formatDate(key.issued_at, { day: "numeric", month: "short", year: "numeric" })}`}
                  </p>
                </div>
                {(key as any).profiles?.full_name && (
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {(key as any).profiles.full_name}
                  </span>
                )}
                <Badge variant="secondary" className={isReturned ? "bg-zinc-500/20 text-zinc-400" : "bg-amber-500/20 text-amber-400"}>
                  {isReturned ? "Returnert" : "Utlevert"}
                </Badge>
              </div>
            );
          })}
          {keys.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <Key className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Ingen nøkler registrert</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Booking ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            <CalendarDays className="w-4 h-4 inline-block mr-1.5" />
            Booking ({upcomingBookings.length} kommende)
          </h2>
          <NyBookingDialog resources={resources.map(r => ({ id: r.id, name: r.name }))} />
        </div>

        {/* Resources */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {resources.map(r => (
            <Card key={r.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{r.name}</p>
                    {r.location && <p className="text-xs text-zinc-500">{r.location}</p>}
                  </div>
                </div>
                {r.description && <p className="text-xs text-zinc-400 mb-2">{r.description}</p>}
                {r.rules && (
                  <p className="text-xs text-zinc-500 bg-zinc-800/50 rounded-lg px-3 py-2 mt-2">
                    <AlertTriangle className="w-3 h-3 inline-block mr-1 text-amber-400" />
                    {r.rules}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bookings */}
        <div className="space-y-2">
          {bookings.map(booking => {
            const status = bookingStatusConfig[booking.status] || bookingStatusConfig.bekreftet;
            const isPast = new Date(booking.date) < new Date();
            const resourceName = (booking as any).booking_resources?.name || "—";
            const bookedBy = (booking as any).profiles?.full_name || "Ukjent";

            return (
              <div key={booking.id} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 ${isPast ? "opacity-60" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${booking.status === "kansellert" ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
                  {booking.status === "kansellert" ?
                    <AlertTriangle className="w-4 h-4 text-red-400" /> :
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{resourceName}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {formatDate(booking.date, { weekday: "short", day: "numeric", month: "short" })} · {booking.time_from?.slice(0, 5)}–{booking.time_to?.slice(0, 5)}
                    {booking.purpose && ` · ${booking.purpose}`}
                    {` · ${bookedBy}`}
                  </p>
                </div>
                <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                {booking.status === "bekreftet" && !isPast && (
                  <CancelBookingButton bookingId={booking.id} />
                )}
              </div>
            );
          })}
          {bookings.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <CalendarDays className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Ingen bookinger — bruk knappen over for å booke</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Leverandører ───────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            <Truck className="w-4 h-4 inline-block mr-1.5" />
            Leverandører ({suppliers.length})
          </h2>
          <NyLeverandorDialog />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {suppliers.map(s => {
            const catLabel = supplierCategoryLabels[s.category] || s.category;
            return (
              <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-zinc-100">{s.name}</h3>
                      <Badge variant="secondary" className="bg-zinc-700/50 text-zinc-300">{catLabel}</Badge>
                    </div>
                    {s.contact_person && <p className="text-sm text-zinc-400 mt-1">{s.contact_person}</p>}
                  </div>
                  {s.rating && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < s.rating! ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                  {s.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {s.phone}
                    </span>
                  )}
                  {s.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {s.email}
                    </span>
                  )}
                  {s.org_nr && (
                    <span>Org: {s.org_nr}</span>
                  )}
                </div>
                {s.notes && (
                  <p className="text-xs text-zinc-400 mt-3 bg-zinc-800/50 rounded-lg px-3 py-2">{s.notes}</p>
                )}
              </div>
            );
          })}
        </div>
        {suppliers.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <Truck className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Ingen leverandører registrert</p>
          </div>
        )}
      </section>
    </div>
  );
}
