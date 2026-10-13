// Section 9: services catalog, cities, notifications, discount codes, review moderation.
import { db, save, ok, find, nextId } from "./db"
import { audit, currentAdmin, patchRecord } from "./admins"

/**
 * @typedef {"veterinary"|"grooming"|"petshop"} ServiceType  new business lines are added here
 * @typedef {{id:number, parentId:(number|null), name:string, type:ServiceType, order:number, active:boolean}} Service
 * @typedef {{id:number, name:string, regions:{id:number, name:string}[]}} City
 * @typedef {{type:"all_users"|"all_clinics"|"all_vets"|"segment"|"single", group?:"owners"|"clinics"|"vets",
 *   cityId?:number, recipientType?:"owner"|"clinic"|"vet", recipientId?:number}} Audience
 * @typedef {{id:number, channel:"push"|"sms", audience:Audience, text:string, templateKey:(string|null),
 *   recipients:number, sentAt:string, adminName:string}} Notification
 * @typedef {{id:number, key:string, title:string, channel:"push"|"sms", text:string}} Template
 * @typedef {{id:number, code:string, type:"percent"|"fixed", value:number, from:string, to:string, usageLimit:number,
 *   used:number, scope:{type:"all"|"clinics"|"services", ids:number[]}, active:boolean}} Discount
 * @typedef {{id:number, appointmentId:number, ownerId:number, clinicId:number, vetId:number, rating:number,
 *   text:string, date:string, status:"pending"|"approved"|"hidden"}} Review
 */

export const SERVICE_TYPES = { veterinary: "دامپزشکی", grooming: "آرایش و نظافت", petshop: "پت‌شاپ" }
const done = v => { save(); return ok(v) }

// ---- services ----
// mock: GET /api/admin/services/
export const listServices = () => ok([...db().services].sort((a, b) => a.order - b.order))

// mock: POST /api/admin/services/  |  PATCH /api/admin/services/{id}/
export const saveService = data => {
  const name = data.name?.trim()
  if (!name) return Promise.reject(new Error("نام خدمت الزامی است"))
  const parentId = data.parentId ? Number(data.parentId) : null
  if (parentId && find("services", parentId)?.parentId) return Promise.reject(new Error("زیرخدمت فقط زیر یک دسته اصلی قرار می‌گیرد"))
  const fields = { name, parentId, type: data.type, active: data.active !== false }
  if (data.id) return done(patchRecord("services", data.id, fields, { section: "content", action: "ویرایش خدمت", entityType: "service" }))
  const rec = { id: nextId(), order: Math.max(0, ...db().services.map(s => s.order)) + 1, ...fields }
  db().services.push(rec)
  audit({ section: "content", action: "ایجاد خدمت", entityType: "service", entityId: rec.id, entityLabel: rec.name, after: rec })
  return done(rec)
}

// Moves a service one step up/down among its siblings. mock: POST /api/admin/services/{id}/move/  {direction}
export const moveService = (id, direction) => {
  const s = find("services", id)
  const siblings = db().services.filter(x => x.parentId === s.parentId).sort((a, b) => a.order - b.order)
  const i = siblings.indexOf(s), j = i + (direction === "up" ? -1 : 1)
  if (j < 0 || j >= siblings.length) return ok(s)
  const other = siblings[j]
  const before = { order: s.order }
  ;[s.order, other.order] = [other.order, s.order]
  audit({ section: "content", action: "تغییر ترتیب خدمت", entityType: "service", entityId: s.id, entityLabel: s.name, before, after: { order: s.order } })
  return done(s)
}

// ---- cities ----
// mock: GET /api/admin/cities/
export const listCities = () => ok(db().cities)

// mock: POST /api/admin/cities/  |  PUT /api/admin/cities/{id}/  {name, regions:[{id?, name}]}
export const saveCity = data => {
  const name = data.name?.trim()
  if (!name) return Promise.reject(new Error("نام شهر الزامی است"))
  const regions = data.regions.filter(r => r.name.trim()).map(r => ({ id: r.id || nextId(), name: r.name.trim() }))
  if (data.id) return done(patchRecord("cities", data.id, { name, regions }, { section: "content", action: "ویرایش شهر و مناطق", entityType: "city" }))
  const rec = { id: nextId(), name, regions }
  db().cities.push(rec)
  audit({ section: "content", action: "ایجاد شهر", entityType: "city", entityId: rec.id, entityLabel: name, after: rec })
  return done(rec)
}

// ---- notifications ----
const COLL = { owner: "owners", clinic: "clinics", vet: "vets" }
const audienceList = a => {
  const d = db()
  if (a.type === "single") { const r = find(COLL[a.recipientType], a.recipientId); return r ? [r] : [] }
  if (a.type === "all_users") return d.owners.filter(o => !o.blocked)
  if (a.type === "all_clinics") return d.clinics.filter(c => c.active)
  if (a.type === "all_vets") return d.vets.filter(v => v.verification.status === "approved")
  const base = a.group === "clinics" ? d.clinics.filter(c => c.active) : a.group === "vets" ? d.vets.filter(v => v.verification.status === "approved") : d.owners.filter(o => !o.blocked)
  // vets have no city of their own; they belong to their clinics' cities
  return base.filter(r => !a.cityId || (a.group === "vets" ? r.clinicIds.some(id => find("clinics", id)?.cityId === Number(a.cityId)) : r.cityId === Number(a.cityId)))
}
// mock: POST /api/admin/notifications/preview/  {audience} -> {count}
export const countRecipients = audience => ok(audienceList(audience).length)

// mock: GET /api/admin/notifications/
export const listNotifications = () => ok(db().notifications)

// mock: POST /api/admin/notifications/  {channel, audience, text, templateKey}
export const sendNotification = ({ channel, audience, text, templateKey = null }) => {
  if (!text?.trim()) return Promise.reject(new Error("متن پیام الزامی است"))
  const recipients = audienceList(audience).length
  if (!recipients) return Promise.reject(new Error("گیرنده‌ای برای این پیام وجود ندارد"))
  const rec = { id: nextId(), channel, audience, text: text.trim(), templateKey, recipients, sentAt: new Date().toISOString(), adminName: currentAdmin()?.name || "" }
  db().notifications.unshift(rec)
  audit({ section: "content", action: channel === "sms" ? "ارسال پیامک" : "ارسال اعلان پوش", entityType: "notification", entityId: rec.id, entityLabel: `${recipients} گیرنده`, after: rec })
  return done(rec)
}

// mock: GET /api/admin/notification-templates/
export const listTemplates = () => ok(db().templates)

// mock: PATCH /api/admin/notification-templates/{id}/  {title, text, channel}
export const updateTemplate = (id, patch) =>
  done(patchRecord("templates", id, patch, { section: "content", action: "ویرایش قالب پیام", entityType: "template", label: t => t.title }))

// ---- discount codes ----
// mock: GET /api/admin/discounts/
export const listDiscounts = () => ok(db().discounts)

// mock: POST /api/admin/discounts/  |  PATCH /api/admin/discounts/{id}/
export const saveDiscount = data => {
  const code = data.code?.trim().toUpperCase()
  if (!code) return Promise.reject(new Error("کد تخفیف الزامی است"))
  if (db().discounts.some(x => x.code === code && x.id !== data.id)) return Promise.reject(new Error("این کد تخفیف تکراری است"))
  const value = Number(data.value)
  if (!(value > 0) || (data.type === "percent" && value > 100)) return Promise.reject(new Error("مقدار تخفیف نامعتبر است"))
  if (!data.from || !data.to || new Date(data.from) > new Date(data.to)) return Promise.reject(new Error("بازه اعتبار نامعتبر است"))
  const fields = {
    code, type: data.type, value, from: new Date(data.from).toISOString(), to: new Date(data.to).toISOString(),
    usageLimit: Number(data.usageLimit) || 0, scope: { type: data.scope.type, ids: data.scope.type === "all" ? [] : data.scope.ids.map(Number) }, active: data.active !== false,
  }
  if (data.id) return done(patchRecord("discounts", data.id, fields, { section: "content", action: "ویرایش کد تخفیف", entityType: "discount", label: x => x.code }))
  const rec = { id: nextId(), used: 0, ...fields }
  db().discounts.unshift(rec)
  audit({ section: "content", action: "ایجاد کد تخفیف", entityType: "discount", entityId: rec.id, entityLabel: code, after: rec })
  return done(rec)
}

// mock: PATCH /api/admin/discounts/{id}/  {active}
export const setDiscountActive = (id, active) =>
  done(patchRecord("discounts", id, { active }, { section: "content", action: active ? "فعال‌سازی کد تخفیف" : "غیرفعال‌سازی کد تخفیف", entityType: "discount", label: x => x.code }))

// ---- reviews ----
// mock: GET /api/admin/reviews/?status=&clinic=&rating=
export const listReviews = () => ok(db().reviews.map(r => ({
  ...r, ownerName: find("owners", r.ownerId)?.name || "—", clinicName: find("clinics", r.clinicId)?.name || "—", vetName: find("vets", r.vetId)?.name || "—",
})))

// mock: POST /api/admin/reviews/{id}/approve/ | /hide/
export const setReviewStatus = (id, status) =>
  done(patchRecord("reviews", id, { status }, { section: "content", action: status === "approved" ? "تأیید نظر" : "مخفی‌سازی نظر", entityType: "review", label: r => `نظر ${r.id}` }))
