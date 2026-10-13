// Section 6: financial reports, transactions and refunds.
import { db, save, ok, find, DAY_MS } from "./db"
import { audit, currentAdmin } from "./admins"
import { inRange } from "../utils/format"

/**
 * @typedef {{id:number, appointmentId:number, ownerId:number, clinicId:number, amount:number, price:number,
 *   hipetShare:number, clinicShare:number, gateway:string, status:"success"|"failed"|"refunded"|"pending",
 *   refCode:string, date:string, refund:({reason:string, date:string, adminName:string}|null),
 *   clinicName?:string, ownerName?:string}} Transaction
 * @typedef {{key:string, start:string, count:number, gross:number, hipetShare:number, clinicShare:number,
 *   deposits:number, refunds:number}} ReportRow
 */

const expand = t => ({ ...t, clinicName: find("clinics", t.clinicId)?.name || "—", ownerName: find("owners", t.ownerId)?.name || "—" })

// mock: GET /api/admin/transactions/?status=&gateway=&clinic=&from=&to=
/** @returns {Promise<Transaction[]>} */
export const listTransactions = () => ok(db().transactions.map(expand))

// mock: POST /api/admin/transactions/{id}/refund/  {reason}  (reason is required)
export const refundTransaction = (id, reason) => {
  const t = find("transactions", id)
  if (!t) return Promise.reject(new Error("تراکنش یافت نشد"))
  if (!reason || !reason.trim()) return Promise.reject(new Error("ثبت دلیل بازگشت وجه الزامی است"))
  if (t.status !== "success") return Promise.reject(new Error("فقط تراکنش موفق قابل بازگشت وجه است"))
  const before = structuredClone(t)
  t.status = "refunded"
  t.refund = { reason: reason.trim(), date: new Date().toISOString(), adminName: currentAdmin()?.name }
  const appt = find("appointments", t.appointmentId)
  if (appt) appt.paymentStatus = "refunded"
  audit({ section: "finance", action: "بازگشت وجه", entityType: "transaction", entityId: t.id, entityLabel: `تراکنش ${t.id}`, before, after: structuredClone(t) })
  save()
  return ok(expand(t))
}

// Jalali calendar parts of a date (numbers), from the platform's persian calendar.
const jParts = d => Object.fromEntries(new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric", month: "numeric", day: "numeric" })
  .formatToParts(new Date(d)).filter(p => p.type !== "literal").map(p => [p.type, Number(p.value)]))

const bucket = (date, period) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  if (period === "weekly") d.setTime(d.getTime() - ((d.getDay() + 1) % 7) * DAY_MS) // Iranian week starts on Saturday
  if (period === "monthly") { const p = jParts(d); return { key: `${p.year}-${String(p.month).padStart(2, "0")}`, start: d } }
  return { key: d.toDateString(), start: d }
}

/**
 * Successful payments grouped by Jalali day, week or month.
 * mock: GET /api/admin/reports/finance/?period=daily|weekly|monthly&from=&to=
 * @returns {Promise<ReportRow[]>}
 */
export const getFinanceReport = (period, range) => {
  const rows = {}
  db().transactions.filter(t => inRange(t.date, range) && t.status !== "failed").forEach(t => {
    const b = bucket(t.date, period)
    const r = rows[b.key] ||= { key: b.key, start: b.start.toISOString(), count: 0, gross: 0, hipetShare: 0, clinicShare: 0, deposits: 0, refunds: 0 }
    if (b.start < new Date(r.start)) r.start = b.start.toISOString()
    if (t.status === "refunded") { r.refunds += t.amount; return }
    r.count += 1; r.gross += t.price; r.hipetShare += t.hipetShare; r.clinicShare += t.clinicShare; r.deposits += t.amount
  })
  return ok(Object.values(rows).sort((a, b) => b.start.localeCompare(a.start)))
}

/**
 * HiPet's share and the clinic's share per clinic.
 * mock: GET /api/admin/reports/clinics/?from=&to=
 */
export const getClinicFinanceReport = range => {
  const rows = {}
  db().transactions.filter(t => t.status === "success" && inRange(t.date, range)).forEach(t => {
    const r = rows[t.clinicId] ||= { clinicId: t.clinicId, clinicName: find("clinics", t.clinicId)?.name || "—", count: 0, gross: 0, hipetShare: 0, clinicShare: 0 }
    r.count += 1; r.gross += t.price; r.hipetShare += t.hipetShare; r.clinicShare += t.clinicShare
  })
  return ok(Object.values(rows).sort((a, b) => b.gross - a.gross))
}
