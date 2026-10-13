// Persian digits, toman and Jalali dates via the platform's Intl (fa-IR + persian calendar).
const nf = new Intl.NumberFormat("fa-IR")
const df = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit" })
const tf = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false })

export const num = n => nf.format(Number(n) || 0)
export const toman = n => `${num(n)} تومان`
export const faDigits = s => String(s ?? "").replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d])
export const jdate = d => (d ? df.format(new Date(d)) : "—")
export const jdatetime = d => (d ? `${df.format(new Date(d))} - ${tf.format(new Date(d))}` : "—")
export const pct = (part, total) => (total ? `${nf.format(Math.round((part / total) * 1000) / 10)}٪` : "۰٪")

/** true when ISO date `d` falls inside [from, to] (Date objects, either may be null) */
export const inRange = (d, [from, to] = []) => {
  const t = new Date(d).getTime()
  if (from && t < new Date(from).setHours(0, 0, 0, 0)) return false
  if (to && t > new Date(to).setHours(23, 59, 59, 999)) return false
  return true
}

// Persian labels and badge colors for every enum used across the panel.
export const LABELS = {
  appointment: { pending: ["در انتظار تأیید", "warning"], confirmed: ["تأییدشده", "info"], completed: ["انجام‌شده", "success"], cancelled: ["لغوشده", "secondary"], no_show: ["عدم حضور", "danger"] },
  payment: { paid: ["پرداخت‌شده", "success"], unpaid: ["پرداخت‌نشده", "warning"], refunded: ["بازگشت وجه", "info"], failed: ["ناموفق", "danger"] },
  tx: { success: ["موفق", "success"], failed: ["ناموفق", "danger"], refunded: ["بازگشت وجه", "info"], pending: ["در انتظار", "warning"] },
  registration: { submitted: ["ثبت‌شده", "primary"], incomplete: ["نقص مدارک", "warning"], approved: ["تأییدشده", "success"], rejected: ["ردشده", "danger"], suspended: ["تعلیق‌شده", "dark"] },
  doc: { pending: ["در انتظار بررسی", "warning"], approved: ["تأیید", "success"], rejected: ["رد", "danger"] },
  vetVerification: { pending: ["در انتظار بررسی", "warning"], approved: ["تأییدشده", "success"], rejected: ["ردشده", "danger"] },
  withdrawal: { pending: ["در انتظار", "warning"], approved: ["پرداخت‌شده", "success"], rejected: ["ردشده", "danger"] },
  ticket: { open: ["باز", "danger"], in_progress: ["در حال بررسی", "warning"], closed: ["بسته", "secondary"] },
  priority: { low: ["کم", "secondary"], normal: ["معمولی", "info"], high: ["بالا", "danger"] },
  sender: { owner: ["کاربر پت", "primary"], clinic: ["کلینیک", "success"], vet: ["دامپزشک", "info"] },
  review: { pending: ["در انتظار", "warning"], approved: ["تأییدشده", "success"], hidden: ["مخفی", "secondary"] },
  active: { true: ["فعال", "success"], false: ["غیرفعال", "secondary"] },
}
export const label = (group, key) => (LABELS[group][key] || [String(key)])[0]
export const options = group => Object.entries(LABELS[group]).map(([value, [text]]) => ({ value, text }))
