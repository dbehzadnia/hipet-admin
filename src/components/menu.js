// Navigation shared by the vertical sidebar and the horizontal top menu; filtered by role.
const MENU = [
  { section: "dashboard", label: "داشبورد", icon: "bx-home-circle", to: "/dashboard" },
  { section: "appointments", label: "نوبت‌ها", icon: "bx-calendar-check", to: "/appointments" },
  {
    section: "clinics", label: "کلینیک‌ها", icon: "bx-clinic", children: [
      { label: "لیست کلینیک‌ها", to: "/clinics" },
      { label: "درخواست‌های ثبت‌نام", to: "/clinics/requests" },
      { label: "معرفی‌ها (سفیران)", to: "/clinics/referrals" },
    ],
  },
  { section: "vets", label: "دامپزشکان", icon: "bx-plus-medical", to: "/vets" },
  { section: "owners", label: "کاربران پت", icon: "bx-user", to: "/owners" },
  {
    section: "finance", label: "مالی", icon: "bx-wallet", children: [
      { label: "گزارش‌های مالی", to: "/finance" },
      { label: "تراکنش‌ها", to: "/finance/transactions" },
    ],
  },
  { section: "settlements", label: "تسویه کلینیک‌ها", icon: "bx-transfer", to: "/settlements" },
  { section: "support", label: "پشتیبانی", icon: "bx-support", to: "/support" },
  {
    section: "content", label: "محتوا و تنظیمات", icon: "bx-cog", children: [
      { label: "خدمات", to: "/content/services" },
      { label: "شهرها و مناطق", to: "/content/cities" },
      { label: "اعلان‌ها", to: "/content/notifications" },
      { label: "کدهای تخفیف", to: "/content/discounts" },
      { label: "نظرات", to: "/content/reviews" },
    ],
  },
  {
    section: "admins", label: "مدیریت ادمین‌ها", icon: "bx-shield-quarter", children: [
      { label: "ادمین‌ها", to: "/admins" },
      { label: "نقش‌ها و دسترسی‌ها", to: "/admins/roles" },
      { label: "گزارش تغییرات", to: "/admins/audit" },
    ],
  },
];

export default MENU
