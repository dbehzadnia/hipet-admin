// Section 3: clinics, registration requests, onboarding checklist, ambassadors and referrals.
import { db, save, ok, find } from "./db"
import { patchRecord } from "./admins"

/**
 * @typedef {"submitted"|"incomplete"|"approved"|"rejected"|"suspended"} RegistrationStatus
 * @typedef {{id:number, title:string, status:"pending"|"approved"|"rejected"}} Doc
 * @typedef {{id:number, name:string, cityId:number, region:string, address:string, phone:string,
 *   techDirector:{name:string, license:string}, staff:{name:string, role:string}[], active:boolean,
 *   ambassador:({level:string}|null), rank:number, referredBy:(number|null), commissionRate:number,
 *   registration:{status:RegistrationStatus, submittedAt:string, note:string, documents:Doc[]},
 *   checklist:{hours:boolean, tariffs:boolean, vets:boolean}, createdAt:string,
 *   cityName?:string, vetCount?:number, appointmentCount?:number, referralCount?:number}} Clinic
 */

export const AMBASSADOR_LEVELS = ["برنزی", "نقره‌ای", "طلایی"]
const meta = action => ({ section: "clinics", action, entityType: "clinic" })

const expand = c => {
  const d = db()
  return {
    ...c,
    cityName: d.cities.find(x => x.id === c.cityId)?.name || "—",
    vetCount: d.vets.filter(v => v.clinicIds.includes(c.id)).length,
    appointmentCount: d.appointments.filter(a => a.clinicId === c.id).length,
    referralCount: d.clinics.filter(x => x.referredBy === c.id).length,
  }
}

// mock: GET /api/admin/clinics/?city=&active=&registration_status=&ambassador=
/** @returns {Promise<Clinic[]>} */
export const listClinics = () => ok(db().clinics.map(expand))

// mock: GET /api/admin/clinics/{id}/
export const getClinic = id => {
  const c = find("clinics", id)
  if (!c) return Promise.reject(new Error("کلینیک یافت نشد"))
  const d = db()
  return ok({
    ...expand(c),
    vets: d.vets.filter(v => v.clinicIds.includes(c.id)).map(v => ({ id: v.id, name: v.name, bookingEnabled: v.bookingEnabled })),
    referrer: c.referredBy ? { id: c.referredBy, name: find("clinics", c.referredBy)?.name } : null,
    referrals: d.clinics.filter(x => x.referredBy === c.id).map(x => ({ id: x.id, name: x.name, status: x.registration.status, createdAt: x.createdAt })),
    recentAppointments: d.appointments.filter(a => a.clinicId === c.id).slice(0, 10).map(a => ({ id: a.id, datetime: a.datetime, status: a.status, ownerName: find("owners", a.ownerId)?.name, vetName: find("vets", a.vetId)?.name })),
  })
}

const done = rec => { save(); return ok(rec) }

// mock: PATCH /api/admin/clinics/{id}/  (name, phone, address, region, techDirector, staff)
export const updateClinic = (id, patch) => done(patchRecord("clinics", id, patch, meta("ویرایش اطلاعات کلینیک")))

// mock: POST /api/admin/clinics/{id}/activate/ | /deactivate/
export const setClinicActive = (id, active) => {
  const c = find("clinics", id)
  if (active && c?.registration.status !== "approved") return Promise.reject(new Error("فقط کلینیک تأییدشده قابل فعال‌سازی است"))
  return done(patchRecord("clinics", id, { active }, meta(active ? "فعال‌سازی کلینیک" : "غیرفعال‌سازی کلینیک")))
}

// mock: PATCH /api/admin/clinics/{id}/  {rank}
export const setClinicRank = (id, rank) => {
  if (!(Number(rank) >= 1)) return Promise.reject(new Error("رتبه باید عددی بزرگ‌تر از صفر باشد"))
  return done(patchRecord("clinics", id, { rank: Number(rank) }, meta("تغییر رتبه نمایش")))
}

// mock: PATCH /api/admin/clinics/{id}/ambassador/  {level|null}
export const setAmbassador = (id, level) =>
  done(patchRecord("clinics", id, { ambassador: level ? { level } : null }, meta(level ? "تغییر وضعیت سفیر" : "لغو سفیری")))

// mock: POST /api/admin/clinics/{id}/registration/  {status, note}
export const setRegistrationStatus = (id, status, note = "") => {
  const c = find("clinics", id)
  if (!c) return Promise.reject(new Error("کلینیک یافت نشد"))
  if (status === "approved" && c.registration.documents.some(x => x.status !== "approved"))
    return Promise.reject(new Error("پیش از تأیید، همه مدارک باید تأیید شوند"))
  // A clinic only becomes bookable once approved; suspension/rejection also takes it offline.
  return done(patchRecord("clinics", id, { registration: { ...c.registration, status, note }, active: status === "approved" }, meta("تغییر وضعیت ثبت‌نام")))
}

// mock: PATCH /api/admin/clinics/{id}/documents/{docId}/  {status}
export const setClinicDocument = (id, docId, status) => {
  const c = find("clinics", id)
  if (!c) return Promise.reject(new Error("کلینیک یافت نشد"))
  const documents = c.registration.documents.map(x => x.id === docId ? { ...x, status } : x)
  return done(patchRecord("clinics", id, { registration: { ...c.registration, documents } }, meta("بررسی مدرک کلینیک")))
}

// mock: GET /api/admin/clinics/referrals/
export const listReferrals = () => {
  const d = db()
  return ok(d.clinics.filter(c => c.ambassador || d.clinics.some(x => x.referredBy === c.id)).map(c => ({
    id: c.id, name: c.name, ambassador: c.ambassador,
    referred: d.clinics.filter(x => x.referredBy === c.id).map(x => ({ id: x.id, name: x.name, status: x.registration.status, active: x.active })),
  })))
}
