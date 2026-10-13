# پنل مدیریت های‌پت — endpointهای mock برای تیم بک‌اند

تمام داده‌های پنل از لایه سرویس `src/services/*.js` می‌آید (یک ماژول برای هر بخش). فعلاً همه توابع mock هستند و داده را از `localStorage` (کلید `hipet_mock_db_v1`) می‌خوانند. بالای هر تابع یک کامنت `// mock: METHOD /path` هست؛ برای اتصال به Django REST فقط بدنه همان تابع با `get/post/put/del` از `src/helpers/api_helper.jsx` جایگزین می‌شود و کامپوننت‌ها تغییری نمی‌کنند. شکل داده‌ها با JSDoc (`@typedef`) بالای هر ماژول مشخص شده است.

## اجرا

```bash
yarn install --ignore-scripts   # node-sass قالب روی Node 22 بیلد نمی‌شود و استفاده هم نمی‌شود (Vite از sass استفاده می‌کند)
yarn dev                        # http://localhost:5173
yarn build
```

ورود آزمایشی (رمز همه `123456`):

| ایمیل | نقش |
|---|---|
| admin@hipet.ir | مدیر ارشد |
| support@hipet.ir | پشتیبانی |
| finance@hipet.ir | مالی |
| onboarding@hipet.ir | اپراتور جذب کلینیک |

برای بازگرداندن داده‌های نمونه، کلید `hipet_mock_db_v1` را از localStorage مرورگر پاک کنید.

## نکات مهم برای بک‌اند

- **Audit log:** در حال حاضر فرانت هر تغییر را با مقدار قبل/بعد در audit log ثبت می‌کند (`audit()` در `services/admins.js`). در نسخه واقعی این کار باید سمت سرور و در همان تراکنشِ تغییر انجام شود تا قابل دور زدن نباشد.
- **دسترسی‌ها:** نقش‌ها برای هر بخش یکی از `none | view | edit` دارند. فرانت منو، مسیرها و دکمه‌ها را بر اساس آن پنهان می‌کند، اما سرور هم باید همین را روی هر endpoint اعمال کند.
- **مشاهده به‌عنوان کلینیک:** فعلاً یک صفحه فقط‌خواندنی داخل همین پنل است. با آماده شدن پنل کلینیک، endpoint زیر باید یک نشست فقط‌خواندنی برگرداند.
- **فهرست‌ها:** جستجو، فیلتر، مرتب‌سازی و صفحه‌بندی فعلاً سمت کلاینت است. برای حجم واقعی داده، endpointهای لیست باید `page`، `page_size`، `ordering` و `search` را پشتیبانی کنند.
- **تاریخ‌ها:** همه تاریخ‌ها ISO 8601 (UTC) رد و بدل می‌شوند؛ تبدیل به شمسی فقط در نمایش انجام می‌شود. مبالغ عدد صحیح و به تومان هستند.

## ۱۰. مدیریت ادمین‌ها — `services/admins.js`
- `POST /api/admin/auth/login/` — ورود (فعلاً از طریق fake backend قالب)
- `GET /api/admin/admins/`
- `POST /api/admin/admins/`
- `PATCH /api/admin/admins/{id}/`
- `POST /api/admin/admins/{id}/deactivate/` و `/activate/`
- `GET /api/admin/roles/`
- `PATCH /api/admin/roles/{key}/` — `{permissions: {section: level}}`
- `GET /api/admin/audit-log/?admin=&section=&from=&to=` — فقط خواندنی
- `POST /api/admin/audit-log/` — فقط تا زمانی که ثبت سمت سرور پیاده شود
- `POST /api/admin/clinics/{id}/view-as/` — ثبت در audit log و برگرداندن نشست فقط‌خواندنی

## ۱. داشبورد — `services/dashboard.js`
- `GET /api/admin/dashboard/` — آمار امروز/۳۰ روز، سری ۱۴ روزه ویزیت و درآمد، هشدارها (کلینیک بدون نوبت ۷ روز، پرداخت ناموفق، تیکت باز)

## ۲. نوبت‌ها — `services/appointments.js`
- `GET /api/admin/appointments/?clinic=&vet=&status=&payment_status=&from=&to=`
- `GET /api/admin/appointments/{id}/` — همراه با تراکنش‌ها
- `POST /api/admin/appointments/` — ایجاد دستی
- `POST /api/admin/appointments/{id}/reschedule/` — `{datetime}`
- `POST /api/admin/appointments/{id}/cancel/` — `{reason}`
- `GET /api/admin/lookups/` — لیست سبک کلینیک‌ها، دامپزشکان، کاربران، حیوانات و خدمات برای فیلترها و فرم‌ها

## ۳. کلینیک‌ها — `services/clinics.js`
- `GET /api/admin/clinics/?city=&active=&registration_status=&ambassador=`
- `GET /api/admin/clinics/{id}/` — همراه با دامپزشکان، معرف، معرفی‌شده‌ها و آخرین نوبت‌ها
- `PATCH /api/admin/clinics/{id}/` — اطلاعات، مسئول فنی، کارکنان، `rank`
- `POST /api/admin/clinics/{id}/activate/` و `/deactivate/`
- `PATCH /api/admin/clinics/{id}/ambassador/` — `{level | null}`
- `POST /api/admin/clinics/{id}/registration/` — `{status, note}`؛ تأیید فقط وقتی همه مدارک تأیید شده‌اند
- `PATCH /api/admin/clinics/{id}/documents/{docId}/` — `{status}`
- `GET /api/admin/clinics/referrals/`
- چک‌لیست راه‌اندازی (`checklist.hours/tariffs/vets`) باید در پاسخ جزئیات کلینیک محاسبه شود.

## ۴. دامپزشکان — `services/vets.js`
- `GET /api/admin/vets/?clinic=&verification=&booking=` — همراه با تعداد ویزیت، درآمد، امتیاز و تعداد لغو
- `GET /api/admin/vets/{id}/` — همراه با کلینیک‌ها و سابقه ویزیت
- `POST /api/admin/vets/{id}/booking/` — `{enabled}`
- `PATCH /api/admin/vets/{id}/documents/{docId}/` — `{status}`
- `POST /api/admin/vets/{id}/verification/` — `{status}`

## ۵. کاربران پت — `services/owners.js`
- `GET /api/admin/owners/?city=&blocked=&joined_from=&joined_to=`
- `GET /api/admin/owners/{id}/` — حیوانات با سوابق پزشکی، نوبت‌ها و پرداخت‌ها
- `POST /api/admin/owners/{id}/block/` — `{reason}` و `POST /api/admin/owners/{id}/unblock/`

## ۶. مالی — `services/finance.js`
- `GET /api/admin/transactions/?status=&gateway=&clinic=&appointment=&from=&to=`
- `POST /api/admin/transactions/{id}/refund/` — `{reason}` اجباری
- `GET /api/admin/reports/finance/?period=daily|weekly|monthly&from=&to=` — گروه‌بندی بر اساس تقویم شمسی (هفته از شنبه)
- `GET /api/admin/reports/clinics/?from=&to=` — سهم های‌پت و سهم کلینیک به تفکیک کلینیک
- خروجی اکسل فعلاً سمت کلاینت (`xlsx`) از همین داده‌ها ساخته می‌شود.

## ۷. تسویه کلینیک‌ها — `services/settlements.js`
- `GET /api/admin/settlements/balances/` — مانده هر کلینیک (مثبت: بستانکار، منفی: بدهکار)
- `GET /api/admin/settlements/withdrawals/?status=&clinic=&from=&to=`
- `POST /api/admin/settlements/withdrawals/{id}/approve/` — باید مانده را بررسی کند
- `POST /api/admin/settlements/withdrawals/{id}/reject/` — `{reason}`

## ۸. پشتیبانی — `services/support.js`
- `GET /api/admin/tickets/?sender_type=&status=&priority=&from=&to=`
- `GET /api/admin/tickets/{id}/`
- `POST /api/admin/tickets/{id}/reply/` — `{text}`
- `PATCH /api/admin/tickets/{id}/` — `{status}` یا `{priority}`
- `GET /api/admin/contact-history/?type=owner|clinic|vet&id=` — تیکت‌ها و پیام‌های مستقیم ارسال‌شده

## ۹. محتوا و تنظیمات — `services/content.js`
- `GET /api/admin/services/`، `POST /api/admin/services/`، `PATCH /api/admin/services/{id}/` — فیلد `type` (`veterinary | grooming | petshop`) برای خدمات آینده
- `POST /api/admin/services/{id}/move/` — `{direction: up|down}`
- `GET /api/admin/cities/`، `POST /api/admin/cities/`، `PUT /api/admin/cities/{id}/` — `{name, regions:[{id?, name}]}`
- `GET /api/admin/notifications/`
- `POST /api/admin/notifications/preview/` — `{audience}` → `{count}`
- `POST /api/admin/notifications/` — `{channel: sms|push, audience, text, templateKey}`؛ `audience.type` یکی از `all_users | all_clinics | all_vets | segment | single`
- `GET /api/admin/notification-templates/`، `PATCH /api/admin/notification-templates/{id}/` — شامل قالب `vaccine_reminder`
- `GET /api/admin/discounts/`، `POST /api/admin/discounts/`، `PATCH /api/admin/discounts/{id}/` — با `used` برای آمار استفاده
- `GET /api/admin/reviews/?status=&clinic=&rating=&from=&to=`
- `POST /api/admin/reviews/{id}/approve/` و `/hide/`
