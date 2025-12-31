# راهنمای راه‌اندازی سیستم مدیریت قراردادها

## پیش‌نیازها

- Node.js نسخه 18 یا بالاتر
- Python 3.8 یا بالاتر (فقط برای آپلود اولیه داده‌ها)
- یک Google Account

---

## مرحله 1: راه‌اندازی Google Sheets

### 1.1. ایجاد Google Sheets API

1. به [Google Cloud Console](https://console.cloud.google.com/) بروید
2. پروژه خود را انتخاب کنید: `gen-lang-client-0603882226`
3. به **APIs & Services > Library** بروید
4. "Google Sheets API" را جستجو و فعال کنید
5. "Google Drive API" را هم فعال کنید

### 1.2. آپلود داده‌های اولیه

Service Account شما آماده است، فقط کافی است داده‌های JSON را آپلود کنید:

```bash
# نصب کتابخانه‌های Python
pip install pandas gspread oauth2client

# اطمینان از وجود فایل system_data.json
# اجرای اسکریپت آپلود
python upload_to_sheets.py
```

اسکریپت به طور خودکار:
- Google Sheet جدید با نام "ProjectData" می‌سازد
- داده‌ها را پردازش و آپلود می‌کند
- Data Validation و Dropdown Lists را اضافه می‌کند
- لینک Google Sheet را نمایش می‌دهد

### 1.3. اشتراک‌گذاری Google Sheet

بعد از ساخت Sheet، باید آن را با Service Account به اشتراک بگذارید:

1. Google Sheet ساخته شده را باز کنید
2. دکمه **Share** را کلیک کنید
3. ایمیل زیر را اضافه کنید:
   ```
   line10contra@gen-lang-client-0603882226.iam.gserviceaccount.com
   ```
4. سطح دسترسی را **Editor** قرار دهید
5. **Send** را کلیک کنید

---

## مرحله 2: راه‌اندازی Google Apps Script

### 2.1. ایجاد Apps Script

1. Google Sheet خود را باز کنید
2. به **Extensions > Apps Script** بروید
3. محتویات `apps-script.js` را کپی کنید
4. در پنجره Apps Script، تمام کد را پاک کنید و کد کپی شده را Paste کنید
5. **فایل را ذخیره کنید** (Ctrl+S)

### 2.2. Deploy کردن به عنوان Web App

1. روی **Deploy** کلیک کنید
2. **New Deployment** را انتخاب کنید
3. روی آیکون تنظیمات (⚙️) کنار "Select type" کلیک کنید
4. **Web App** را انتخاب کنید
5. تنظیمات زیر را اعمال کنید:
   - **Description:** "Contract Management API"
   - **Execute as:** Me
   - **Who has access:** Anyone
6. **Deploy** را کلیک کنید
7. **Authorize access** را تایید کنید
8. **Web App URL** را کپی کنید (چیزی شبیه به `https://script.google.com/macros/s/...`)

---

## مرحله 3: پیکربندی Frontend

### 3.1. کپی فایل محیطی

```bash
# در پوشه پروژه
cp .env.example .env.local
```

### 3.2. تکمیل متغیرهای محیطی

فایل `.env.local` را باز کنید و مقادیر زیر را وارد کنید:

```bash
# URL اسکریپت گوگل که در مرحله 2.2 کپی کردید
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

---

## مرحله 4: نصب و اجرای پروژه

### 4.1. نصب Dependencies

```bash
npm install
```

### 4.2. اجرای حالت Development

```bash
npm run dev
```

پروژه روی `http://localhost:5173` اجرا می‌شود.

### 4.3. بررسی اتصال

1. مرورگر را باز کنید
2. Console را چک کنید (F12)
3. اگر خطای CORS دیدید:
   - مطمئن شوید Apps Script به درستی Deploy شده
   - مطمئن شوید "Who has access" روی "Anyone" است
   - Apps Script را Redeploy کنید

---

## مرحله 5: Build برای Production

### 5.1. ساخت فایل‌های نهایی

```bash
npm run build
```

### 5.2. پیش‌نمایش Production

```bash
npm run preview
```

### 5.3. Deploy

می‌توانید از سرویس‌های رایگان زیر استفاده کنید:

- **Vercel:** `vercel deploy`
- **Netlify:** Drag & Drop پوشه `dist`
- **GitHub Pages**
- **Cloudflare Pages**

---

## عیب‌یابی

### خطا: "URL اسکریپت گوگل تنظیم نشده است"

**راه حل:** فایل `.env.local` را بررسی کنید و مطمئن شوید `VITE_APPS_SCRIPT_URL` تنظیم شده است.

### خطا: CORS

**راه حل:**
1. Apps Script را Redeploy کنید
2. مطمئن شوید "Who has access" روی "Anyone" است
3. Cache مرورگر را پاک کنید

### داده‌ها نمایش داده نمی‌شود

**راه حل:**
1. Console مرورگر را بررسی کنید
2. مطمئن شوید Google Sheet دارای شیت "Main_Data" است
3. مطمئن شوید Service Account دسترسی Editor دارد

### خطا در بروزرسانی

**راه حل:**
1. مطمئن شوید Apps Script دارای تابع `doPost` است
2. دسترسی‌های Apps Script را بررسی کنید

---

## ساختار Google Sheet

پس از آپلود، Google Sheet شما باید دو شیت داشته باشد:

### 1. Main_Data
حاوی تمام داده‌های قراردادها با ستون‌های زیر:
- شرح عملیات
- پیمانکار
- مرحله انجام مجوز
- وضعیت اسناد
- وضعیت برونسپاری
- برآورد اولیه
- روش برونسپاری
- نوع قرارداد
- تاریخ برگزاری
- شناسه نامه

### 2. Dropdowns (مخفی)
حاوی لیست گزینه‌های ممکن برای هر ستون

---

## منابع مفید

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [React Query Documentation](https://tanstack.com/query/latest)

---

## پشتیبانی

در صورت بروز مشکل، موارد زیر را بررسی کنید:
1. Console مرورگر (F12)
2. Network Tab برای بررسی درخواست‌های API
3. Google Apps Script Logs (در Apps Script Editor > **Executions**)
