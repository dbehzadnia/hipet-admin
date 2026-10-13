// Section 4: vets.
import { db, save, ok, find } from "./db"
import { patchRecord } from "./admins"
import { expand as expandAppointment } from "./appointments"

/**
 * @typedef {{id:number, name:string, nezamCode:string, phone:string, clinicIds:number[], bookingEnabled:boolean,
 *   verification:{status:"pending"|"approved"|"rejected", documents:{id:number,title:string,status:string}[]},
 *   createdAt:string, clinicNames?:string[], visits?:number, revenue?:number, cancellations?:number,
 *   rating?:(number|null), ratingCount?:number}} Vet
 */

const meta = action => ({ section: "vets", action, entityType: "vet" })

const expand = v => {
  const d = db()
  const appts = d.appointments.filter(a => a.vetId === v.id)
  const done = appts.filter(a => a.status === "completed")
  const rated = d.reviews.filter(r => r.vetId === v.id && r.status !== "hidden")
  return {
    ...v,
    clinicNames: v.clinicIds.map(id => find("clinics", id)?.name).filter(Boolean),
    visits: done.length,
    revenue: done.reduce((s, a) => s + a.price, 0),
    cancellations: appts.filter(a => a.status === "cancelled").length,
    rating: rated.length ? Math.round((rated.reduce((s, r) => s + r.rating, 0) / rated.length) * 10) / 10 : null,
    ratingCount: rated.length,
  }
}

// mock: GET /api/admin/vets/?clinic=&verification=&booking=
/** @returns {Promise<Vet[]>} */
export const listVets = () => ok(db().vets.map(expand))

// mock: GET /api/admin/vets/{id}/
export const getVet = id => {
  const v = find("vets", id)
  if (!v) return Promise.reject(new Error("دامپزشک یافت نشد"))
  return ok({
    ...expand(v),
    clinics: v.clinicIds.map(cid => find("clinics", cid)).filter(Boolean).map(c => ({ id: c.id, name: c.name, active: c.active })),
    appointments: db().appointments.filter(a => a.vetId === v.id).map(expandAppointment),
  })
}

// mock: POST /api/admin/vets/{id}/booking/  {enabled}
export const setVetBooking = (id, enabled) => {
  if (enabled && find("vets", id)?.verification.status !== "approved") return Promise.reject(new Error("ابتدا مدارک دامپزشک باید تأیید شود"))
  const rec = patchRecord("vets", id, { bookingEnabled: enabled }, meta(enabled ? "فعال‌سازی نوبت‌دهی" : "غیرفعال‌سازی نوبت‌دهی"))
  save()
  return ok(rec)
}

// mock: PATCH /api/admin/vets/{id}/documents/{docId}/  {status}
export const setVetDocument = (id, docId, status) => {
  const v = find("vets", id)
  if (!v) return Promise.reject(new Error("دامپزشک یافت نشد"))
  const documents = v.verification.documents.map(x => x.id === docId ? { ...x, status } : x)
  const rec = patchRecord("vets", id, { verification: { ...v.verification, documents } }, meta("بررسی مدرک دامپزشک"))
  save()
  return ok(rec)
}

// mock: POST /api/admin/vets/{id}/verification/  {status}
export const setVetVerification = (id, status) => {
  const v = find("vets", id)
  if (!v) return Promise.reject(new Error("دامپزشک یافت نشد"))
  if (status === "approved" && v.verification.documents.some(x => x.status !== "approved")) return Promise.reject(new Error("پیش از تأیید، همه مدارک باید تأیید شوند"))
  const patch = { verification: { ...v.verification, status }, ...(status !== "approved" && { bookingEnabled: false }) }
  const rec = patchRecord("vets", id, patch, meta(status === "approved" ? "تأیید دامپزشک" : "رد دامپزشک"))
  save()
  return ok(rec)
}
