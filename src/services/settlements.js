// Section 7: clinic withdrawals, balances and settlement history.
import { db, save, ok, find } from "./db"
import { patchRecord } from "./admins"

/**
 * @typedef {{id:number, clinicId:number, amount:number, iban:string, status:"pending"|"approved"|"rejected",
 *   requestedAt:string, decidedAt:(string|null), reason:string, clinicName?:string}} Withdrawal
 * @typedef {{clinicId:number, clinicName:string, earned:number, paidOut:number, pending:number, balance:number}} Balance
 *   balance > 0: HiPet owes the clinic (creditor). balance < 0: the clinic owes HiPet (debtor).
 */

const expand = w => ({ ...w, clinicName: find("clinics", w.clinicId)?.name || "—" })

// HiPet collects deposits online and keeps its commission; the rest is owed to the clinic.
const balanceOf = clinicId => {
  const d = db()
  const earned = d.transactions.filter(t => t.clinicId === clinicId && t.status === "success").reduce((s, t) => s + t.amount - t.hipetShare, 0)
  const ws = d.withdrawals.filter(w => w.clinicId === clinicId)
  const paidOut = ws.filter(w => w.status === "approved").reduce((s, w) => s + w.amount, 0)
  const pending = ws.filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0)
  return { clinicId, clinicName: find("clinics", clinicId)?.name || "—", earned, paidOut, pending, balance: earned - paidOut }
}

// mock: GET /api/admin/settlements/balances/
/** @returns {Promise<Balance[]>} */
export const listBalances = () => ok(db().clinics.filter(c => c.registration.status === "approved").map(c => balanceOf(c.id)))

// mock: GET /api/admin/settlements/withdrawals/?status=&clinic=&from=&to=
/** @returns {Promise<Withdrawal[]>} */
export const listWithdrawals = () => ok(db().withdrawals.map(w => ({ ...expand(w), balance: balanceOf(w.clinicId).balance })))

const decide = (id, status, reason) => {
  const w = find("withdrawals", id)
  if (!w) return Promise.reject(new Error("درخواست یافت نشد"))
  if (w.status !== "pending") return Promise.reject(new Error("این درخواست قبلاً بررسی شده است"))
  if (status === "approved" && balanceOf(w.clinicId).balance < w.amount) return Promise.reject(new Error("مانده حساب کلینیک کمتر از مبلغ درخواست است"))
  const rec = patchRecord("withdrawals", id, { status, reason, decidedAt: new Date().toISOString() },
    { section: "settlements", action: status === "approved" ? "تأیید درخواست برداشت" : "رد درخواست برداشت", entityType: "withdrawal", label: x => `برداشت ${x.id} - ${find("clinics", x.clinicId)?.name}` })
  save()
  return ok(expand(rec))
}

// mock: POST /api/admin/settlements/withdrawals/{id}/approve/
export const approveWithdrawal = id => decide(id, "approved", "")

// mock: POST /api/admin/settlements/withdrawals/{id}/reject/  {reason}
export const rejectWithdrawal = (id, reason) => reason?.trim() ? decide(id, "rejected", reason.trim()) : Promise.reject(new Error("دلیل رد الزامی است"))
