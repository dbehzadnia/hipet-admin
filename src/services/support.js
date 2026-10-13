// Section 8: support tickets and per-person contact history.
import { db, save, ok, find } from "./db"
import { currentAdmin, patchRecord } from "./admins"

/**
 * @typedef {"owner"|"clinic"|"vet"} SenderType
 * @typedef {{from:"user"|"admin", adminName?:string, text:string, date:string}} Message
 * @typedef {{id:number, senderType:SenderType, senderId:number, subject:string,
 *   status:"open"|"in_progress"|"closed", priority:"low"|"normal"|"high", createdAt:string,
 *   messages:Message[], senderName?:string}} Ticket
 */

const COLL = { owner: "owners", clinic: "clinics", vet: "vets" }
const expand = t => ({ ...t, senderName: find(COLL[t.senderType], t.senderId)?.name || "—", lastAt: t.messages[t.messages.length - 1].date })
const meta = action => ({ section: "support", action, entityType: "ticket", label: t => `تیکت ${t.id}` })

// mock: GET /api/admin/tickets/?sender_type=&status=&priority=&from=&to=
/** @returns {Promise<Ticket[]>} */
export const listTickets = () => ok(db().tickets.map(expand))

// mock: GET /api/admin/tickets/{id}/
export const getTicket = id => {
  const t = find("tickets", id)
  return t ? ok(expand(t)) : Promise.reject(new Error("تیکت یافت نشد"))
}

// mock: POST /api/admin/tickets/{id}/reply/  {text}
export const replyTicket = (id, text) => {
  const t = find("tickets", id)
  if (!t) return Promise.reject(new Error("تیکت یافت نشد"))
  if (!text.trim()) return Promise.reject(new Error("متن پاسخ خالی است"))
  const messages = [...t.messages, { from: "admin", adminName: currentAdmin()?.name, text: text.trim(), date: new Date().toISOString() }]
  const rec = patchRecord("tickets", id, { messages, status: t.status === "open" ? "in_progress" : t.status }, meta("پاسخ به تیکت"))
  save()
  return ok(expand(rec))
}

// mock: PATCH /api/admin/tickets/{id}/  {status|priority}
export const updateTicket = (id, patch) => {
  const rec = patchRecord("tickets", id, patch, meta(patch.status ? "تغییر وضعیت تیکت" : "تغییر اولویت تیکت"))
  save()
  return ok(expand(rec))
}

/**
 * Tickets plus direct notifications for one owner/clinic/vet, newest first.
 * mock: GET /api/admin/contact-history/?type=owner|clinic|vet&id=
 */
export const getContactHistory = (type, id) => {
  const d = db()
  const tickets = d.tickets.filter(t => t.senderType === type && t.senderId === Number(id))
    .map(t => ({ kind: "ticket", id: t.id, date: t.createdAt, title: t.subject, status: t.status }))
  const messages = d.notifications.filter(n => n.audience.type === "single" && n.audience.recipientType === type && n.audience.recipientId === Number(id))
    .map(n => ({ kind: n.channel, id: n.id, date: n.sentAt, title: n.text }))
  return ok([...tickets, ...messages].sort((a, b) => b.date.localeCompare(a.date)))
}
