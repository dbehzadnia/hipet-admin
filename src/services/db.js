// Mock database for the HiPet admin panel.
// shortcut: all data lives in localStorage and is seeded on first load; replace each
// service module's functions with Django REST calls (api_helper get/post/put/del).

const KEY = "hipet_mock_db_v1"
const DAY = 86400000

// Deterministic PRNG so the seed looks the same on every machine.
let s = 20251013
const rnd = () => {
  s |= 0
  s = (s + 0x6d2b79f5) | 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1))
const pick = arr => arr[Math.floor(rnd() * arr.length)]
const chance = p => rnd() < p
const round = (n, step = 1000) => Math.round(n / step) * step
const iso = t => new Date(t).toISOString()
const phone = () => "09" + int(100000000, 399999999)

const FIRST = ["علی", "محمد", "زهرا", "فاطمه", "مریم", "رضا", "حسین", "سارا", "نگار", "امیر", "مهدی", "نازنین", "پریسا", "کاوه", "آرش", "الهام", "سینا", "یاسمن", "بهاره", "حمید", "شیما", "پویا", "ترانه", "مهسا"]
const LAST = ["احمدی", "محمدی", "رضایی", "کریمی", "حسینی", "موسوی", "جعفری", "صادقی", "رحیمی", "نوری", "کاظمی", "تهرانی", "شریفی", "یزدانی", "قاسمی", "فرهادی", "اکبری", "سلطانی", "زمانی", "پاکزاد"]
const person = () => `${pick(FIRST)} ${pick(LAST)}`

export const CITIES = [
  { id: 1, name: "تهران", regions: ["منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۵", "منطقه ۶", "منطقه ۷"] },
  { id: 2, name: "کرج", regions: ["گوهردشت", "عظیمیه", "مهرشهر"] },
  { id: 3, name: "اصفهان", regions: ["سپاهان‌شهر", "چهارباغ", "جلفا"] },
  { id: 4, name: "شیراز", regions: ["معالی‌آباد", "قصرالدشت"] },
  { id: 5, name: "مشهد", regions: ["سجاد", "وکیل‌آباد"] },
  { id: 6, name: "تبریز", regions: ["ولیعصر", "منظریه"] },
]

const SERVICES = [
  { id: 1, parentId: null, name: "ویزیت", type: "veterinary" },
  { id: 2, parentId: 1, name: "ویزیت عمومی", type: "veterinary" },
  { id: 3, parentId: 1, name: "ویزیت اورژانس", type: "veterinary" },
  { id: 4, parentId: 1, name: "ویزیت در منزل", type: "veterinary" },
  { id: 5, parentId: null, name: "واکسیناسیون", type: "veterinary" },
  { id: 6, parentId: 5, name: "واکسن سالیانه سگ", type: "veterinary" },
  { id: 7, parentId: 5, name: "واکسن سه‌گانه گربه", type: "veterinary" },
  { id: 8, parentId: null, name: "جراحی", type: "veterinary" },
  { id: 9, parentId: 8, name: "عقیم‌سازی", type: "veterinary" },
  { id: 10, parentId: 8, name: "جراحی بافت نرم", type: "veterinary" },
  { id: 11, parentId: null, name: "دندانپزشکی", type: "veterinary" },
  { id: 12, parentId: 11, name: "جرم‌گیری", type: "veterinary" },
  { id: 13, parentId: null, name: "آزمایش و تصویربرداری", type: "veterinary" },
  { id: 14, parentId: 13, name: "آزمایش خون", type: "veterinary" },
  { id: 15, parentId: 13, name: "سونوگرافی", type: "veterinary" },
]

export const SECTIONS = {
  dashboard: "داشبورد",
  appointments: "نوبت‌ها",
  clinics: "کلینیک‌ها",
  vets: "دامپزشکان",
  owners: "کاربران پت",
  finance: "مالی",
  settlements: "تسویه کلینیک‌ها",
  support: "پشتیبانی",
  content: "محتوا و تنظیمات",
  admins: "مدیریت ادمین‌ها",
}

const all = (level) => Object.fromEntries(Object.keys(SECTIONS).map(k => [k, level]))
const ROLES = [
  { key: "super_admin", name: "مدیر ارشد", permissions: all("edit") },
  {
    key: "support", name: "پشتیبانی",
    permissions: { ...all("none"), dashboard: "view", appointments: "edit", clinics: "view", vets: "view", owners: "edit", support: "edit" },
  },
  {
    key: "finance", name: "مالی",
    permissions: { ...all("none"), dashboard: "view", appointments: "view", clinics: "view", finance: "edit", settlements: "edit" },
  },
  {
    key: "onboarding", name: "اپراتور جذب کلینیک",
    permissions: { ...all("none"), dashboard: "view", clinics: "edit", vets: "edit", support: "view" },
  },
]

const seed = () => {
  const now = Date.now()
  const ago = d => now - d * DAY - int(0, DAY - 1)

  const admins = [
    { id: 1, name: "مدیر ارشد", email: "admin@hipet.ir", password: "123456", role: "super_admin", active: true },
    { id: 2, name: "نگار پشتیبان", email: "support@hipet.ir", password: "123456", role: "support", active: true },
    { id: 3, name: "حمید مالی", email: "finance@hipet.ir", password: "123456", role: "finance", active: true },
    { id: 4, name: "سارا جذب", email: "onboarding@hipet.ir", password: "123456", role: "onboarding", active: true },
  ]

  const clinicPrefix = ["کلینیک دامپزشکی", "بیمارستان دامپزشکی", "درمانگاه حیوانات"]
  const clinicNames = ["آوا", "پارسیان", "مهرپت", "سپید", "آرامش", "نوین", "البرز", "دنا", "رویان", "ستاره", "پردیس", "زاگرس", "کیان", "بهار", "آفتاب", "مهر", "سینا", "ارغوان", "نیک‌پت", "آسا", "تندرست", "پاسارگاد", "مهراد", "رادین", "شایان", "آریا", "دلفین", "یاس", "بامداد", "ونوس", "امید", "آیین", "پرنیان", "سروش", "ماهان", "نارون", "هومان", "کوثر", "سپهر", "تینا"]
  const LEVELS = ["برنزی", "نقره‌ای", "طلایی"]
  const REG = ["approved", "approved", "approved", "approved", "approved", "submitted", "incomplete", "rejected", "suspended"]
  const clinics = clinicNames.map((n, i) => {
    const city = i < 18 ? CITIES[0] : pick(CITIES)
    const regStatus = i < 22 ? "approved" : pick(REG)
    const approved = regStatus === "approved"
    const amb = approved && chance(0.3)
    return {
      id: 101 + i,
      name: `${pick(clinicPrefix)} ${n}`,
      cityId: city.id,
      region: pick(city.regions),
      address: `${city.name}، خیابان ${pick(["ولیعصر", "شریعتی", "آزادی", "انقلاب", "فاطمی", "مطهری"])}، پلاک ${int(1, 300)}`,
      phone: "021" + int(22000000, 88999999),
      techDirector: { name: "دکتر " + person(), license: "ن-" + int(10000, 99999) },
      staff: Array.from({ length: int(2, 5) }, () => ({ name: person(), role: pick(["منشی", "تکنسین", "پرستار", "مدیر داخلی"]) })),
      active: approved && chance(0.9),
      ambassador: amb ? { level: pick(LEVELS) } : null,
      rank: i + 1,
      referredBy: null,
      commissionRate: pick([10, 12, 15]),
      registration: {
        status: regStatus,
        submittedAt: iso(ago(int(1, 200))),
        note: regStatus === "incomplete" ? "تصویر پروانه بهره‌برداری ناخوانا است" : "",
        documents: ["پروانه بهره‌برداری", "پروانه مسئول فنی", "کارت ملی مدیر", "مجوز نظام دامپزشکی"].map((t, k) => ({
          id: k + 1, title: t,
          status: approved ? "approved" : pick(["pending", "pending", "approved", "rejected"]),
        })),
      },
      checklist: { hours: approved || chance(0.4), tariffs: approved ? chance(0.9) : chance(0.3), vets: approved ? chance(0.95) : chance(0.2) },
      createdAt: iso(ago(int(10, 300))),
    }
  })
  // referral graph: ambassadors referred some other clinics
  const ambassadors = clinics.filter(c => c.ambassador)
  clinics.forEach(c => { if (!c.ambassador && ambassadors.length && chance(0.4)) c.referredBy = pick(ambassadors).id })

  const vets = Array.from({ length: 60 }, (_, i) => {
    const reg = i < 50 ? "approved" : pick(["pending", "pending", "rejected"])
    const own = clinics.filter(c => c.registration.status === "approved")
    return {
      id: 201 + i,
      name: "دکتر " + person(),
      nezamCode: "د-" + int(1000, 9999),
      phone: phone(),
      clinicIds: reg === "approved" ? [...new Set([pick(own).id, ...(chance(0.3) ? [pick(own).id] : [])])] : [],
      bookingEnabled: reg === "approved" && chance(0.9),
      verification: {
        status: reg,
        documents: ["کارت نظام دامپزشکی", "مدرک تحصیلی", "کارت ملی"].map((t, k) => ({
          id: k + 1, title: t, status: reg === "approved" ? "approved" : pick(["pending", "approved", "rejected"]),
        })),
      },
      createdAt: iso(ago(int(5, 300))),
    }
  })

  const owners = Array.from({ length: 160 }, (_, i) => ({
    id: 1001 + i, name: person(), phone: phone(), cityId: pick(CITIES).id, blocked: chance(0.03), createdAt: iso(ago(int(1, 365))),
  }))
  const SPECIES = { "سگ": ["ژرمن شپرد", "پامرانین", "شیتزو", "هاسکی", "تریر"], "گربه": ["پرشین", "اسکاتیش", "بریتیش", "خانگی"], "پرنده": ["طوطی", "مرغ عشق"], "خرگوش": ["لوپ", "هلندی"] }
  const PET_NAMES = ["پاپی", "ملوس", "جسی", "مکس", "لونا", "کوکو", "بلا", "رکس", "پیشی", "تینا", "چارلی", "سیمبا", "نانا", "هاپو", "برفی"]
  let petId = 5001
  const pets = owners.flatMap(o => Array.from({ length: int(1, 2) }, () => {
    const sp = pick(Object.keys(SPECIES))
    return {
      id: petId++, ownerId: o.id, name: pick(PET_NAMES), species: sp, breed: pick(SPECIES[sp]),
      birthDate: iso(ago(int(450, 3000))),
      records: Array.from({ length: int(0, 4) }, () => ({
        date: iso(ago(int(1, 400))),
        title: pick(["واکسن سالیانه", "ضدانگل", "معاینه عمومی", "آزمایش خون", "جرم‌گیری"]),
        note: pick(["", "بدون عارضه", "نیاز به پیگیری ۲ هفته بعد"]),
      })),
    }
  }))

  const leaf = SERVICES.filter(x => x.parentId)
  const bookable = clinics.filter(c => c.active)
  const appointments = []
  const transactions = []
  let apId = 70001, txId = 90001
  for (let i = 0; i < 420; i++) {
    const t = now + int(-60, 10) * DAY + int(-36, 36) * 900000
    const pet = pick(pets)
    const clinic = pick(bookable)
    const cvets = vets.filter(v => v.clinicIds.includes(clinic.id))
    const vet = cvets.length ? pick(cvets) : pick(vets.filter(v => v.verification.status === "approved"))
    const svc = pick(leaf)
    const past = t < now
    const status = past ? pick(["completed", "completed", "completed", "completed", "completed", "cancelled", "no_show"]) : pick(["confirmed", "confirmed", "pending"])
    const price = round(int(300, 1500) * 1000, 10000)
    const deposit = round(int(100, 200) * 1000, 10000)
    let payment = chance(0.06) ? "failed" : (status === "pending" ? "unpaid" : "paid")
    if (status === "cancelled" && payment === "paid" && chance(0.5)) payment = "refunded"
    const ap = {
      id: apId++, ownerId: pet.ownerId, petId: pet.id, clinicId: clinic.id, vetId: vet.id, serviceId: svc.id,
      datetime: iso(t), status, paymentStatus: payment, price, deposit,
      emergency: svc.id === 3 || chance(0.04), createdAt: iso(Math.min(now - int(0, 3600000), t - int(1, 10) * DAY)),
    }
    appointments.push(ap)
    if (payment !== "unpaid") {
      const commission = round(price * clinic.commissionRate / 100)
      transactions.push({
        id: txId++, appointmentId: ap.id, ownerId: ap.ownerId, clinicId: clinic.id, amount: deposit, price,
        hipetShare: commission, clinicShare: price - commission,
        gateway: pick(["زرین‌پال", "سامان کیش", "به‌پرداخت ملت"]),
        status: payment === "failed" ? "failed" : payment === "refunded" ? "refunded" : "success",
        refCode: String(int(100000000, 999999999)), date: ap.createdAt,
        refund: payment === "refunded" ? { reason: "لغو نوبت توسط کلینیک", date: ap.datetime, adminName: "سیستم" } : null,
      })
    }
  }
  appointments.sort((a, b) => b.datetime.localeCompare(a.datetime))
  transactions.sort((a, b) => b.date.localeCompare(a.date))

  const withdrawals = Array.from({ length: 45 }, (_, i) => {
    const c = pick(bookable)
    const st = i < 8 ? "pending" : pick(["approved", "approved", "approved", "rejected"])
    const at = ago(int(i < 8 ? 0 : 3, 90))
    return {
      id: 3001 + i, clinicId: c.id, amount: round(int(500, 6000) * 1000, 10000),
      iban: "IR" + int(10, 99) + "0" + int(100000000, 999999999) + int(100000000, 999999999) + int(1000, 9999),
      status: st, requestedAt: iso(at), decidedAt: st === "pending" ? null : iso(at + DAY), reason: st === "rejected" ? "شماره شبا با نام مالک مطابقت ندارد" : "",
    }
  })

  const SUBJ = ["مشکل در پرداخت بیعانه", "عدم نمایش نوبت", "درخواست لغو نوبت", "تغییر ساعات کاری", "مشکل ورود به حساب", "اعتراض به تسویه", "ثبت دامپزشک جدید", "شکایت از کیفیت خدمات"]
  const tickets = Array.from({ length: 70 }, (_, i) => {
    const type = pick(["owner", "owner", "clinic", "vet"])
    const sender = type === "owner" ? pick(owners) : type === "clinic" ? pick(bookable) : pick(vets)
    const at = ago(int(0, 40))
    const status = i < 15 ? "open" : pick(["open", "in_progress", "closed", "closed"])
    const messages = [{ from: "user", text: "سلام، " + pick(SUBJ) + " دارم. لطفاً بررسی کنید.", date: iso(at) }]
    if (status !== "open") messages.push({ from: "admin", adminName: "نگار پشتیبان", text: "سلام، درخواست شما در حال بررسی است.", date: iso(at + 3600000) })
    return { id: 4001 + i, senderType: type, senderId: sender.id, subject: pick(SUBJ), status, priority: pick(["low", "normal", "normal", "high"]), createdAt: iso(at), messages }
  })

  const templates = [
    { id: 1, key: "vaccine_reminder", title: "یادآوری واکسن", channel: "sms", text: "{name} عزیز، زمان واکسن {pet} فرا رسیده است. از طریق های‌پت نوبت بگیرید." },
    { id: 2, key: "appointment_reminder", title: "یادآوری نوبت", channel: "push", text: "نوبت شما در {clinic} فردا ساعت {time} است." },
    { id: 3, key: "payment_failed", title: "پرداخت ناموفق", channel: "sms", text: "پرداخت بیعانه نوبت شما ناموفق بود. لطفاً دوباره تلاش کنید." },
  ]

  const discounts = [
    { id: 1, code: "HIPET20", type: "percent", value: 20, from: iso(ago(30)), to: iso(now + 30 * DAY), usageLimit: 500, used: 132, scope: { type: "all", ids: [] }, active: true },
    { id: 2, code: "VACCINE50", type: "fixed", value: 50000, from: iso(ago(10)), to: iso(now + 20 * DAY), usageLimit: 200, used: 41, scope: { type: "services", ids: [6, 7] }, active: true },
    { id: 3, code: "AVA10", type: "percent", value: 10, from: iso(ago(90)), to: iso(ago(5)), usageLimit: 100, used: 100, scope: { type: "clinics", ids: [101] }, active: false },
  ]

  const reviews = appointments.filter(a => a.status === "completed").slice(0, 80).map((a, i) => ({
    id: 6001 + i, appointmentId: a.id, ownerId: a.ownerId, clinicId: a.clinicId, vetId: a.vetId, rating: int(1, 5),
    text: pick(["برخورد پرسنل عالی بود.", "زمان انتظار زیاد بود.", "دکتر بسیار دقیق و دلسوز بودند.", "قیمت‌ها نسبت به کیفیت مناسب بود.", "از رسیدگی راضی نبودم."]),
    date: a.datetime, status: i < 20 ? "pending" : pick(["approved", "approved", "hidden"]),
  }))

  return {
    seq: 100000,
    admins, roles: ROLES, clinics, vets, owners, pets, appointments, transactions, withdrawals, tickets,
    services: SERVICES.map((x, i) => ({ ...x, order: i, active: true })),
    cities: CITIES.map(c => ({ ...c, regions: c.regions.map((r, k) => ({ id: c.id * 100 + k, name: r })) })),
    templates, notifications: [], discounts, reviews, audit: [],
  }
}

let cache = null
export const db = () => {
  if (!cache) {
    try { cache = JSON.parse(localStorage.getItem(KEY)) } catch { cache = null }
    if (!cache) { cache = seed(); save() }
  }
  return cache
}
export const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(cache)) } catch { /* storage full: data stays in memory */ }
}
export const nextId = () => { db().seq += 1; return db().seq }

// Every service returns copies so UI state never aliases the store.
export const ok = v => new Promise(r => setTimeout(() => r(v === undefined ? v : structuredClone(v)), 120))
export const find = (coll, id) => db()[coll].find(x => x.id === Number(id))
export const DAY_MS = DAY
