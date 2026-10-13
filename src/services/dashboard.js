// Section 1: dashboard aggregates.
import { db, ok, DAY_MS } from "./db"

/**
 * @typedef {{date:string, visits:number, revenue:number, gross:number}} DayPoint
 * @typedef {{todayAppointments:number, activeClinics:number, activeVets:number, activeUsers:number,
 *   monthRevenue:number, monthGross:number, pendingClinicRequests:number, pendingVetRequests:number,
 *   cancelled:number, noShows:number, last30Total:number, days:DayPoint[],
 *   alerts:{idleClinics:{id:number,name:string,lastBooking:(string|null)}[], failedPayments:object[], openTickets:number}}} DashboardData
 */

const dayKey = t => new Date(t).toDateString()

// mock: GET /api/admin/dashboard/
/** @returns {Promise<DashboardData>} */
export const getDashboard = () => {
  const d = db(), now = Date.now()
  const today = dayKey(now)
  const last30 = d.appointments.filter(a => { const t = Date.parse(a.datetime); return t <= now && t > now - 30 * DAY_MS })
  const monthStart = new Date(now - 30 * DAY_MS)
  const monthTx = d.transactions.filter(t => t.status === "success" && new Date(t.date) >= monthStart)

  const days = Array.from({ length: 14 }, (_, i) => {
    const t = now - (13 - i) * DAY_MS
    const k = dayKey(t)
    const tx = d.transactions.filter(x => x.status === "success" && dayKey(x.date) === k)
    return {
      date: new Date(t).toISOString(),
      visits: d.appointments.filter(a => a.status === "completed" && dayKey(a.datetime) === k).length,
      revenue: tx.reduce((s, x) => s + x.hipetShare, 0),
      gross: tx.reduce((s, x) => s + x.price, 0),
    }
  })

  const lastBooking = {}
  d.appointments.forEach(a => { if (!lastBooking[a.clinicId] || a.createdAt > lastBooking[a.clinicId]) lastBooking[a.clinicId] = a.createdAt })
  const idleSince = now - 7 * DAY_MS

  return ok({
    todayAppointments: d.appointments.filter(a => dayKey(a.datetime) === today).length,
    activeClinics: d.clinics.filter(c => c.active).length,
    activeVets: d.vets.filter(v => v.bookingEnabled).length,
    activeUsers: new Set(last30.map(a => a.ownerId)).size,
    monthRevenue: monthTx.reduce((s, x) => s + x.hipetShare, 0),
    monthGross: monthTx.reduce((s, x) => s + x.price, 0),
    pendingClinicRequests: d.clinics.filter(c => ["submitted", "incomplete"].includes(c.registration.status)).length,
    pendingVetRequests: d.vets.filter(v => v.verification.status === "pending").length,
    last30Total: last30.length,
    cancelled: last30.filter(a => a.status === "cancelled").length,
    noShows: last30.filter(a => a.status === "no_show").length,
    days,
    alerts: {
      idleClinics: d.clinics.filter(c => c.active && !(lastBooking[c.id] && Date.parse(lastBooking[c.id]) > idleSince))
        .map(c => ({ id: c.id, name: c.name, lastBooking: lastBooking[c.id] || null })),
      failedPayments: d.transactions.filter(t => t.status === "failed" && Date.parse(t.date) > idleSince)
        .map(t => ({ ...t, clinicName: d.clinics.find(c => c.id === t.clinicId)?.name })),
      openTickets: d.tickets.filter(t => t.status !== "closed").length,
    },
  })
}
