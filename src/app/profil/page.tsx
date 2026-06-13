import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, Building2, Shield, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/profil/ProfileForm";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, tenants(*)")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  const tenant = (profile as any).tenants;
  const memberSince = new Date(profile.created_at).toLocaleDateString("no-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const roleLabel =
    profile.role === "styreleder" ? "Styreleder" :
    profile.role === "styremedlem" ? "Styremedlem" :
    profile.role === "varamedlem" ? "Varamedlem" :
    profile.role === "vaktmester" ? "Vaktmester" :
    profile.role === "beboer" ? "Beboer" : profile.role;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Min profil</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Se og oppdater din kontaktinformasjon
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {profile.full_name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                {profile.full_name || "Ukjent bruker"}
              </h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  {roleLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Medlem siden {memberSince}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Info */}
      {tenant && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-zinc-500" />
              <h3 className="font-semibold text-zinc-200">Boligselskap</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Navn</p>
                <p className="text-zinc-200">{tenant.name}</p>
              </div>
              {tenant.org_nr && (
                <div>
                  <p className="text-zinc-500">Org.nr</p>
                  <p className="text-zinc-200">{tenant.org_nr}</p>
                </div>
              )}
              {tenant.address && (
                <div>
                  <p className="text-zinc-500">Adresse</p>
                  <p className="text-zinc-200">
                    {tenant.address}, {tenant.zip} {tenant.city}
                  </p>
                </div>
              )}
              {tenant.year_built && (
                <div>
                  <p className="text-zinc-500">Byggeår</p>
                  <p className="text-zinc-200">{tenant.year_built}</p>
                </div>
              )}
              {tenant.num_units && (
                <div>
                  <p className="text-zinc-500">Antall enheter</p>
                  <p className="text-zinc-200">{tenant.num_units}</p>
                </div>
              )}
              {tenant.building_type && (
                <div>
                  <p className="text-zinc-500">Bygningstype</p>
                  <p className="text-zinc-200">{tenant.building_type}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <User className="w-5 h-5 text-zinc-500" />
            <h3 className="font-semibold text-zinc-200">Kontaktinformasjon</h3>
          </div>
          <ProfileForm
            profile={{
              full_name: profile.full_name,
              phone: profile.phone,
              email: profile.email,
              role: profile.role,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
