// Section 5: pet owners (users), their pets, appointments and payments.
import { db, save, ok, find } from "./db"
import { patchRecord } from "./admins"
import { expand as expandAppointment } from "./appointments"

/**
 * @typedef {{date:string, title:string, note:string}} PetRecord
 * @typedef {{id:number, ownerId:number, name:string, species:string, breed:string, birthDate:string, records:PetRecord[]}} Pet
 * @typedef {{id:number, name:string, phone:string, cityId:number, blocked:boolean, createdAt:string,
 *   cityName?:string, petCount?:number, appointmentCount?:number, totalPaid?:number}} Owner
 */

const expand = o => {
  const d = db()
  return {
    ...o,
    cityName: d.cities.find(c => c.id === o.cityId)?.name || "—",
    petCount: d.pets.filter(p => p.ownerId === o.id).length,
    appointmentCount: d.appointments.filter(a => a.ownerId === o.id).length,
    totalPaid: d.transactions.filter(t => t.ownerId === o.id && t.status === "success").reduce((s, t) => s + t.amount, 0),
  }
}

// mock: GET /api/admin/owners/?city=&blocked=
/** @returns {Promise<Owner[]>} */
export const listOwners = () => ok(db().owners.map(expand))

// mock: GET /api/admin/owners/{id}/  (with pets[].records, appointments, payments)
export const getOwner = id => {
  const o = find("owners", id)
  if (!o) return Promise.reject(new Error("کاربر یافت نشد"))
  const d = db()
  return ok({
    ...expand(o),
    pets: d.pets.filter(p => p.ownerId === o.id),
    appointments: d.appointments.filter(a => a.ownerId === o.id).map(expandAppointment),
    payments: d.transactions.filter(t => t.ownerId === o.id).map(t => ({ ...t, clinicName: find("clinics", t.clinicId)?.name })),
  })
}

// mock: POST /api/admin/owners/{id}/block/ | /unblock/  {reason}
export const setOwnerBlocked = (id, blocked, reason = "") => {
  const rec = patchRecord("owners", id, { blocked, blockReason: blocked ? reason : "" },
    { section: "owners", action: blocked ? "مسدودسازی کاربر" : "رفع مسدودی کاربر", entityType: "owner" })
  save()
  return ok(rec)
}
