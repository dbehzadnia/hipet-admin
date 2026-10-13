// Section 10: admin users, roles/permissions, audit log, "view as clinic".
import { db, save, ok, find, nextId, SECTIONS } from "./db"

/**
 * @typedef {"none"|"view"|"edit"} Level
 * @typedef {{key:string, name:string, permissions:Record<string, Level>}} Role
 * @typedef {{id:number, name:string, email:string, role:string, active:boolean}} Admin
 * @typedef {{id:number, adminId:number, adminName:string, section:string, action:string,
 *   entityType:string, entityId:(number|string|null), entityLabel:string, before:any, after:any, date:string}} AuditEntry
 */

export { SECTIONS }

/** @returns {Admin|null} logged-in admin from the template's auth session */
export const currentAdmin = () => {
  try {
    const u = JSON.parse(localStorage.getItem("authUser"))
    return u && db().admins.find(a => a.id === u.id && a.active) || null
  } catch { return null }
}

/** @returns {Level} */
export const level = section => {
  const a = currentAdmin()
  const role = a && db().roles.find(r => r.key === a.role)
  return (role && role.permissions[section]) || "none"
}
export const canView = section => level(section) !== "none"
export const canEdit = section => level(section) === "edit"

const strip = a => { if (!a) return a; const { password, ...rest } = a; return rest }

/**
 * Writes one audit entry. Every create/edit/delete/status change in the panel calls this.
 * mock: POST /api/admin/audit-log/ (in production the backend should write this itself)
 */
export const audit = ({ section, action, entityType, entityId = null, entityLabel = "", before = null, after = null }) => {
  const a = currentAdmin()
  db().audit.unshift({
    id: nextId(), adminId: a ? a.id : 0, adminName: a ? a.name : "نامشخص",
    section, action, entityType, entityId, entityLabel,
    before: strip(before), after: strip(after), date: new Date().toISOString(),
  })
  save()
}

// Applies a patch to a stored record and audits it with before/after values.
export const patchRecord = (coll, id, patch, { section, action, entityType, label }) => {
  const rec = find(coll, id)
  if (!rec) throw new Error("رکورد یافت نشد")
  const before = structuredClone(rec)
  Object.assign(rec, patch)
  audit({ section, action, entityType, entityId: rec.id, entityLabel: label ? label(rec) : rec.name || String(rec.id), before, after: structuredClone(rec) })
  return rec
}

// mock: GET /api/admin/admins/
export const listAdmins = () => ok(db().admins.map(strip))

// mock: POST /api/admin/admins/
export const createAdmin = data => {
  if (db().admins.some(a => a.email === data.email)) return Promise.reject(new Error("این ایمیل قبلاً ثبت شده است"))
  const rec = { id: nextId(), active: true, ...data }
  db().admins.push(rec)
  audit({ section: "admins", action: "ایجاد ادمین", entityType: "admin", entityId: rec.id, entityLabel: rec.name, after: rec })
  return ok(strip(rec))
}

// mock: PATCH /api/admin/admins/{id}/
export const updateAdmin = (id, data) => {
  const patch = { ...data }
  if (!patch.password) delete patch.password
  const rec = patchRecord("admins", id, patch, { section: "admins", action: "ویرایش ادمین", entityType: "admin" })
  save()
  return ok(strip(rec))
}

// mock: POST /api/admin/admins/{id}/deactivate/  (and /activate/)
export const setAdminActive = (id, active) => {
  if (!active && currentAdmin()?.id === Number(id)) return Promise.reject(new Error("نمی‌توانید حساب خودتان را غیرفعال کنید"))
  const rec = patchRecord("admins", id, { active }, { section: "admins", action: active ? "فعال‌سازی ادمین" : "غیرفعال‌سازی ادمین", entityType: "admin" })
  save()
  return ok(strip(rec))
}

// mock: GET /api/admin/roles/
export const listRoles = () => ok(db().roles)

// mock: PATCH /api/admin/roles/{key}/
export const updateRolePermissions = (key, permissions) => {
  const role = db().roles.find(r => r.key === key)
  if (!role) return Promise.reject(new Error("نقش یافت نشد"))
  if (key === "super_admin") return Promise.reject(new Error("دسترسی مدیر ارشد قابل تغییر نیست"))
  const before = structuredClone(role)
  role.permissions = { ...permissions }
  audit({ section: "admins", action: "تغییر دسترسی نقش", entityType: "role", entityId: key, entityLabel: role.name, before, after: structuredClone(role) })
  save()
  return ok(role)
}

// mock: GET /api/admin/audit-log/?admin=&section=&from=&to=
export const listAudit = () => ok(db().audit)

// mock: POST /api/admin/clinics/{id}/view-as/  (returns a read-only clinic panel session)
export const logViewAsClinic = clinic => {
  audit({ section: "admins", action: "مشاهده به‌عنوان کلینیک", entityType: "clinic", entityId: clinic.id, entityLabel: clinic.name })
  return ok(true)
}

/** Used by the template's fake login. mock: POST /api/admin/auth/login/ */
export const authenticate = (email, password) => {
  const a = db().admins.find(x => x.email === email && x.password === password && x.active)
  return a ? { ...strip(a), uid: a.id, username: a.name } : null
}
