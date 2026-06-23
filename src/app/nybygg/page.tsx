import { getAuthContext } from "@/lib/auth";
import { formatDate, daysUntil, isOverdue } from "@/lib/config";
import {
  Building, AlertTriangle, CheckCircle2, Clock, FileText,
  Scale, Wrench, Calendar, Shield, Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NyReklamasjonDialog, ClaimStatusButton } from "@/components/nybygg/NybyggDialogs";
import { NyFdvDialog } from "@/components/nybygg/NyFdvDialog";

const claimStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Aktiv", color: "bg-amber-500/20 text-amber-400" },
  submitted: { label: "Innmeldt", color: "bg-blue-500/20 text-blue-400" },
  resolved: { label: "Utbedret", color: "bg-emerald-500/20 text-emerald-400" },
  expired: { label: "Foreldet", color: "bg-red-500/20 text-red-400" },
};

const claimTypeLabels: Record<string, string> = {
  reklamasjon: "Reklamasjon",
  garanti: "Garanti",
  mangel: "Mangel",
};

export default async function NybyggPage() {
  const { supabase, tenantId, tenantName } = await getAuthContext();

  const [claimsRes, fdvRes, tenantRes] = await Promise.all([
    supabase.from("warranty_claims").select("*").eq("tenant_id", tenantId).order("deadline"),
    supabase.from("fdv_documents").select("*").eq("tenant_id", tenantId).order("category"),
    supabase.from("tenants").select("year_built").eq("id", tenantId).single(),
  ]);

  const claims = claimsRes.data || [];
  const fdvDocs = fdvRes.data || [];
  const yearBuilt = tenantRes.data?.year_built;

  const activeClaims = claims.filter(c => c.status === "active" || c.status === "submitted");
  const resolvedClaims = claims.filter(c => c.status === "resolved");
  const urgentClaims = activeClaims.filter(c => {
    const days = daysUntil(c.deadline);
    return days !== null && days <= 90;
  });

  // Beregn 5-aarsfrist
  const fiveYearDeadline = yearBuilt ? new Date(yearBuilt + 5, 7, 1) : null;
  const daysToFiveYear = fiveYearDeadline ? daysUntil(fiveYearDeadline.toISOString()) : null;

  // FDV med forfalt vedlikehold
  const overdueFdv = fdvDocs.filter(d => d.next_maintenance_date && isOverdue(d.next_maintenance_date));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Nybygg</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Reklamasjonsfrister, FDV-dokumentasjon og juridisk veiledning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NyFdvDialog />
          <NyReklamasjonDialog />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`border-zinc-800 ${urgentClaims.length > 0 ? "bg-red-950/20" : "bg-zinc-900"}`}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${urgentClaims.length > 0 ? "text-red-400" : "text-emerald-400"}`}>{urgentClaims.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Haster (&lt;90d)</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{activeClaims.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Aktive saker</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-zinc-100">{fdvDocs.length}</p>
            <p className="text-xs text-zinc-500 mt-1">FDV-dokumenter</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-zinc-100">{yearBuilt || "—"}</p>
            <p className="text-xs text-zinc-500 mt-1">Byggeår</p>
          </CardContent>
        </Card>
      </div>

      {/* Legal Info Banner */}
      {daysToFiveYear !== null && daysToFiveYear > 0 && (
        <div className="bg-violet-950/30 border border-violet-900/30 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Scale className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-violet-300">Bustadsoppføringslova § 30</p>
              <p className="text-sm text-zinc-300 mt-1">
                Absolutt reklamasjonsfrist utløper <strong className="text-white">{formatDate(fiveYearDeadline!.toISOString(), { day: "numeric", month: "long", year: "numeric" })}</strong> ({daysToFiveYear} dager igjen).
                Alle mangler må meldes til entreprenør før denne datoen.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <p className="text-xs text-violet-400">Anbefaling: Bestill ekstern befaring med takstmann minst 3 mnd før fristen</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warranty Claims */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <AlertTriangle className="w-4 h-4 inline-block mr-1.5" />
          Reklamasjoner og garantisaker ({activeClaims.length} aktive)
        </h2>
        <div className="space-y-3">
          {claims.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
              <Shield className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Ingen reklamasjoner registrert</p>
            </div>
          ) : (
            claims.filter(c => c.status !== "resolved").map(claim => {
              const status = claimStatusConfig[claim.status] || claimStatusConfig.active;
              const days = daysUntil(claim.deadline);
              const overdue = isOverdue(claim.deadline);
              const urgent = days !== null && days <= 90 && days > 0;

              return (
                <div key={claim.id} className={`bg-zinc-900 border rounded-xl p-5 ${overdue ? "border-red-900/50" : urgent ? "border-amber-900/50" : "border-zinc-800"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-zinc-100">{claim.title}</h3>
                        <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                        <Badge variant="secondary" className="bg-zinc-500/20 text-zinc-400">{claimTypeLabels[claim.claim_type] || claim.claim_type}</Badge>
                      </div>
                      {claim.description && <p className="text-sm text-zinc-400">{claim.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      {days !== null && (
                        <p className={`text-sm font-bold ${overdue ? "text-red-400" : urgent ? "text-amber-400" : "text-zinc-300"}`}>
                          {overdue ? `${Math.abs(days)}d over frist` : `${days}d igjen`}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500">Frist: {formatDate(claim.deadline)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      {claim.building_part && <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{claim.building_part}</span>}
                      {claim.contractor && <span className="flex items-center gap-1"><Building className="w-3 h-3" />{claim.contractor}</span>}
                      {claim.legal_basis && <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{claim.legal_basis}</span>}
                    </div>
                    <ClaimStatusButton claimId={claim.id} currentStatus={claim.status} />
                  </div>
                </div>
              );
            })
          )}

          {/* Resolved */}
          {resolvedClaims.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-zinc-500 mb-2">Utbedret ({resolvedClaims.length})</p>
              {resolvedClaims.map(claim => (
                <div key={claim.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 opacity-60 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate">{claim.title}</p>
                    {claim.resolution_notes && <p className="text-xs text-zinc-500">{claim.resolution_notes}</p>}
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">Utbedret</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FDV Documents */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <FileText className="w-4 h-4 inline-block mr-1.5" />
          FDV-dokumentasjon ({fdvDocs.length} dokumenter)
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {fdvDocs.map(doc => {
            const overdue = doc.next_maintenance_date && isOverdue(doc.next_maintenance_date);
            return (
              <div key={doc.id} className={`bg-zinc-900 border rounded-xl p-4 ${overdue ? "border-amber-900/50" : "border-zinc-800"}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-zinc-200">{doc.title}</h3>
                  <Badge variant="secondary" className="bg-zinc-500/20 text-zinc-400 text-[10px]">{doc.category}</Badge>
                </div>
                {doc.notes && <p className="text-xs text-zinc-500 mb-2">{doc.notes}</p>}
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  {doc.maintenance_interval && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{doc.maintenance_interval}</span>
                  )}
                  {doc.next_maintenance_date && (
                    <span className={`flex items-center gap-1 ${overdue ? "text-amber-400" : ""}`}>
                      <Calendar className="w-3 h-3" />Neste: {formatDate(doc.next_maintenance_date, { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
