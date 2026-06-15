import { getAuthContext } from "@/lib/auth";
import { formatCost, formatDate, isOverdue } from "@/lib/config";
import {
  Banknote, CreditCard, FileText, TrendingUp,
  AlertTriangle, CheckCircle2, Clock, Receipt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvoiceApproveButton, InvoiceRejectButton } from "@/components/okonomi/InvoiceActions";

const invoiceStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Til godkjenning", color: "bg-amber-500/20 text-amber-400" },
  approved: { label: "Godkjent", color: "bg-emerald-500/20 text-emerald-400" },
  rejected: { label: "Avvist", color: "bg-red-500/20 text-red-400" },
  paid: { label: "Betalt", color: "bg-blue-500/20 text-blue-400" },
};

export default async function OkonomiPage() {
  const { supabase, tenantId } = await getAuthContext();

  const [accountsRes, invoicesRes, budgetRes, expensesRes] = await Promise.all([
    supabase.from("bank_accounts").select("*").eq("tenant_id", tenantId),
    supabase.from("invoices").select("*").eq("tenant_id", tenantId).order("due_date"),
    supabase.from("budget_items").select("*").eq("tenant_id", tenantId).eq("year", new Date().getFullYear()).order("category"),
    supabase.from("expenses").select("*, profiles!expenses_submitted_by_fkey(full_name)").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
  ]);

  const accounts = accountsRes.data || [];
  const invoices = invoicesRes.data || [];
  const budget = budgetRes.data || [];
  const expenses = expensesRes.data || [];

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const pendingInvoices = invoices.filter(i => i.status === "pending");
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalBudgeted = budget.reduce((sum, b) => sum + Number(b.budgeted_amount), 0);
  const totalActual = budget.reduce((sum, b) => sum + Number(b.actual_amount), 0);
  const budgetUsage = totalBudgeted > 0 ? Math.round((totalActual / totalBudgeted) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Økonomi</h1>
        <p className="text-sm text-zinc-500 mt-1">Bankkontoer, fakturaer og budsjett</p>
      </div>

      {/* Bank Accounts */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <CreditCard className="w-4 h-4 inline-block mr-1.5" />
          Bankkonto og innskudd
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {accounts.map(a => (
            <Card key={a.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{a.name}</p>
                    <p className="text-xs text-zinc-500">{a.account_number}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-zinc-100">{formatCost(Number(a.balance))}</p>
                <p className="text-xs text-zinc-500 mt-1">{a.bank_name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-zinc-900 border-zinc-800 mt-4">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm text-zinc-400">Totalt</span>
            <span className="text-xl font-bold text-emerald-400">{formatCost(totalBalance)}</span>
          </CardContent>
        </Card>
      </section>

      {/* Invoices */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <FileText className="w-4 h-4 inline-block mr-1.5" />
          Fakturaer ({pendingInvoices.length} til godkjenning)
        </h2>
        <div className="space-y-2">
          {invoices.map(inv => {
            const status = invoiceStatusConfig[inv.status] || invoiceStatusConfig.pending;
            const overdue = inv.status === "pending" && isOverdue(inv.due_date);
            return (
              <div key={inv.id} className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 ${overdue ? "border-red-900/50" : "border-zinc-800"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  inv.status === "paid" ? "bg-blue-500/20" :
                  inv.status === "approved" ? "bg-emerald-500/20" :
                  overdue ? "bg-red-500/20" : "bg-amber-500/20"
                }`}>
                  {inv.status === "paid" ? <CheckCircle2 className="w-4 h-4 text-blue-400" /> :
                   inv.status === "approved" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                   overdue ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                   <Clock className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{inv.vendor}</p>
                  <p className="text-xs text-zinc-500">{inv.description} · Forfaller {formatDate(inv.due_date, { day: "numeric", month: "short" })}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-zinc-200">{formatCost(Number(inv.amount))}</p>
                  {inv.category && <p className="text-xs text-zinc-500">{inv.category}</p>}
                </div>
                <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                {inv.status === "pending" && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <InvoiceApproveButton invoiceId={inv.id} />
                    <InvoiceRejectButton invoiceId={inv.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Budget */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <TrendingUp className="w-4 h-4 inline-block mr-1.5" />
          Budsjett {new Date().getFullYear()} ({budgetUsage}% brukt)
        </h2>
        <div className="space-y-3">
          {budget.map(b => {
            const usage = Number(b.budgeted_amount) > 0 ? (Number(b.actual_amount) / Number(b.budgeted_amount)) * 100 : 0;
            const isOver = usage > 100;
            return (
              <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{b.category}</p>
                    {b.description && <p className="text-xs text-zinc-500">{b.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-300">{formatCost(Number(b.actual_amount))} / {formatCost(Number(b.budgeted_amount))}</p>
                    <p className={`text-xs ${isOver ? "text-red-400" : "text-zinc-500"}`}>{Math.round(usage)}%</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isOver ? "bg-red-500" : usage > 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(usage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Totalt budsjett</span>
              <span className="text-sm text-zinc-300">{formatCost(totalActual)} / {formatCost(totalBudgeted)}</span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Expenses */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          <Receipt className="w-4 h-4 inline-block mr-1.5" />
          Utlegg
        </h2>
        <div className="space-y-2">
          {expenses.map(exp => (
            <div key={exp.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <Receipt className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{exp.description}</p>
                <p className="text-xs text-zinc-500">
                  {(exp as any).profiles?.full_name} · {formatDate(exp.created_at, { day: "numeric", month: "short" })}
                </p>
              </div>
              <p className="text-sm font-medium text-zinc-200">{formatCost(Number(exp.amount))}</p>
              <Badge variant="secondary" className={
                exp.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                exp.status === "rejected" ? "bg-red-500/20 text-red-400" :
                "bg-amber-500/20 text-amber-400"
              }>
                {exp.status === "approved" ? "Godkjent" : exp.status === "rejected" ? "Avvist" : "Venter"}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
