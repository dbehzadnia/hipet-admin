// Section 2: appointments.
import { db, save, ok, find, nextId } from "./db"
import { audit, patchRecord } from "./admins"

/**
 * @typedef {"pending"|"confirmed"|"completed"|"cancelled"|"no_show"} AppointmentStatus
 * @typedef {"paid"|"unpaid"|"refunded"|"failed"} PaymentStatus
 * @typedef {{id:number, ownerId:number, petId:number, clinicId:number, vetId:number, serviceId:number,
 *   datetime:string, status:AppointmentStatus, paymentStatus:PaymentStatus, price:number, deposit:number,
 *   emergency:boolean, createdAt:string, cancelReason?:string,
 *   ownerName:string, petName:string, clinicName:string, vetName:string, serviceName:string}} Appointment
 */

/** Adds display names to an appointment (the API should return these nested). */
export const expand = a => {
  const d = db()
  const pet = d.pets.find(p => p.id === a.petId)
  return {
    ...a,
    ownerName: find("owners", a.ownerId)?.name || "—",
    ownerPhone: find("owners", a.ownerId)?.phone || "",
    petName: pet ? `${pet.name} (${pet.species})` : "—",
    clinicName: find("clinics", a.clinicId)?.name || "—",
    vetName: find("vets", a.vetId)?.name || "—",
    serviceName: find("services", a.serviceId)?.name || "—",
  }
}

const label = a => `نوبت ${a.id}`

// mock: GET /api/admin/appointments/?clinic=&vet=&status=&from=&to=
/** @returns {Promise<Appointment[]>} */
export const listAppointments = () => ok(db().appointments.map(expand))

// mock: GET /api/admin/appointments/{id}/
export const getAppointment = id => {
  const a = find("appointments", id)
  if (!a) return Promise.reject(new Error("نوبت یافت نشد"))
  return ok({ ...expand(a), transactions: db().transactions.filter(t => t.appointmentId === a.id) })
}

// mock: POST /api/admin/appointments/{id}/reschedule/  {datetime}
export const rescheduleAppointment = (id, datetime) => {
  const rec = patchRecord("appointments", id, { datetime: new Date(datetime).toISOString() },
    { section: "appointments", action: "تغییر زمان نوبت", entityType: "appointment", label })
  save()
  return ok(rec)
}

// mock: POST /api/admin/appointments/{id}/cancel/  {reason}
export const cancelAppointment = (id, reason) => {
  const a = find("appointments", id)
  if (!a) return Promise.reject(new Error("نوبت یافت نشد"))
  if (["cancelled", "completed"].includes(a.status)) return Promise.reject(new Error("این نوبت قابل لغو نیست"))
  const rec = patchRecord("appointments", id, { status: "cancelled", cancelReason: reason },
    { section: "appointments", action: "لغو نوبت", entityType: "appointment", label })
  save()
  return ok(rec)
}

// mock: POST /api/admin/appointments/  (manual booking by an admin; deposit is collected later)
export const createAppointment = data => {
  const owner = find("owners", data.ownerId), pet = find("pets", data.petId)
  if (!owner || !pet || pet.ownerId !== owner.id) return Promise.reject(new Error("کاربر و حیوان انتخاب‌شده معتبر نیستند"))
  if (!find("clinics", data.clinicId) || !find("vets", data.vetId)) return Promise.reject(new Error("کلینیک یا دامپزشک معتبر نیست"))
  const rec = {
    id: nextId(), ownerId: owner.id, petId: pet.id, clinicId: Number(data.clinicId), vetId: Number(data.vetId),
    serviceId: Number(data.serviceId), datetime: new Date(data.datetime).toISOString(), status: "confirmed",
    paymentStatus: "unpaid", price: Number(data.price) || 0, deposit: Number(data.deposit) || 0,
    emergency: !!data.emergency, createdAt: new Date().toISOString(),
  }
  db().appointments.unshift(rec)
  audit({ section: "appointments", action: "ایجاد دستی نوبت", entityType: "appointment", entityId: rec.id, entityLabel: label(rec), after: rec })
  save()
  return ok(expand(rec))
}

// Lookup lists for filters and forms.
// mock: GET /api/admin/lookups/  (clinics, vets, owners, pets, services; id+name only)
export const getLookups = () => {
  const d = db()
  return ok({
    clinics: d.clinics.map(c => ({ id: c.id, name: c.name, active: c.active })),
    vets: d.vets.map(v => ({ id: v.id, name: v.name, clinicIds: v.clinicIds, bookingEnabled: v.bookingEnabled })),
    owners: d.owners.map(o => ({ id: o.id, name: o.name, phone: o.phone })),
    pets: d.pets.map(p => ({ id: p.id, ownerId: p.ownerId, name: p.name, species: p.species })),
    services: d.services.filter(s => s.parentId && s.active).map(s => ({ id: s.id, name: s.name })),
  })
}
