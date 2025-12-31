import pandas as pd
import json
import re
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# --- تنظیمات ---
input_filename = 'system_data.json'
SPREADSHEET_NAME = "ProjectData"
TARGET_SHEET_JSON = "شش ماه دوم (اصلی) 1404"

# --- توابع تمیزکاری ---
def clean_text(text):
    if pd.isna(text) or text == "" or text is None: return ""
    text = str(text).strip()
    replacements = {'ي': 'ی', 'ك': 'ک', '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'}
    for old, new in replacements.items(): text = text.replace(old, new)
    return re.sub(r'\s+', ' ', text)

def clean_number(value):
    if pd.isna(value) or value == "" or value is None: return 0
    s = str(value)
    digits = re.sub(r'[^\d]', '', s)
    return int(digits) if digits else 0

# --- 1. پردازش داده‌ها ---
print("⏳ در حال پردازش داده‌ها...")
with open(input_filename, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

# Determine data source
if isinstance(raw_data, list):
    print(f"📦 فایل JSON شامل لیست ساده است. استفاده به عنوان '{TARGET_SHEET_JSON}'...")
    rows = raw_data
elif isinstance(raw_data, dict) and 'sheets_data' in raw_data:
     # Try to find the target sheet or pick the first one
    if TARGET_SHEET_JSON in raw_data['sheets_data']:
         rows = raw_data['sheets_data'][TARGET_SHEET_JSON]
    else:
         first_key = list(raw_data['sheets_data'].keys())[0]
         print(f"⚠️ شیت '{TARGET_SHEET_JSON}' پیدا نشد. استفاده از '{first_key}'...")
         rows = raw_data['sheets_data'][first_key]
else:
    print("❌ فرمت فایل JSON پشتیبانی نمی‌شود.")
    exit(1)

# نگاشت ستون‌ها
col_mapping = {
    'شرح عملیات برونسپاری': 'شرح عملیات',
    'پیمانکار': 'پیمانکار',
    'مرحله انجام مجوز': 'مرحله انجام مجوز',
    'آخرین وضعیت اسناد مناقصه / قرارداد': 'وضعیت اسناد',
    'آخرین وضعیت برونسپاری': 'وضعیت برونسپاری',
    'برآورد اولیه (ریال)': 'برآورد اولیه',
    'روش برونسپاری': 'روش برونسپاری',
    'نوع قرارداد': 'نوع قرارداد',
    'تاریخ برگزاری': 'تاریخ برگزاری',
    'شناسه نامه پیش نویس': 'شناسه نامه'
}

dropdown_cols = ['مرحله انجام مجوز', 'وضعیت اسناد', 'وضعیت برونسپاری', 'روش برونسپاری', 'نوع قرارداد']
# ستون نظرات به صورت پیش‌فرض اضافه می‌شود
extra_cols = ['نظرات']
dropdown_data = {k: set() for k in dropdown_cols}

header_idx = -1
col_map = {}
data_rows = []

# تشخیص هدرها از کلیدهای دیکشنری (برای فرمت لیست دیکشنری)
if isinstance(rows[0], dict):
    print("💡 تشخیص فرمت: لیست دیکشنری")
    for row in rows:
        new_row = {}
        for k, v in row.items():
            # تمیز کردن کلید (حذف کاراکترهای اضافی)
            clean_k = clean_text(k)
            
            # پیدا کردن ستون معادل
            target_col = None
            for j_key, s_key in col_mapping.items():
                if j_key in clean_k:
                    target_col = s_key
                    break
            
            if target_col:
                val = clean_number(v) if target_col == 'برآورد اولیه' else clean_text(v)
                new_row[target_col] = val
                if target_col in dropdown_cols and val: dropdown_data[target_col].add(val)
        
        if new_row: data_rows.append(new_row)

else:
    # منطق قبلی برای پیدا کردن هدر در مقادیر (برای فرمت‌های خاص دیگر)
    for i, row in enumerate(rows[:10]):
        row_vals = [str(v).strip() for v in row.values() if v]
        if "شرح عملیات برونسپاری" in row_vals:
            header_idx = i
            for k, v in row.items():
                if v:
                    clean = clean_text(v)
                    for j_key, s_key in col_mapping.items():
                        if j_key in clean:
                            col_map[k] = s_key
                            break
            break

    if header_idx != -1:
        for row in rows[header_idx+1:]:
            if all(v is None for v in row.values()): continue
            new_row = {}
            for k, v in row.items():
                if k in col_map:
                    std = col_map[k]
                    val = clean_number(v) if std == 'برآورد اولیه' else clean_text(v)
                    new_row[std] = val
                    if std in dropdown_cols and val: dropdown_data[std].add(val)
            if new_row: data_rows.append(new_row)

df = pd.DataFrame(data_rows)
final_cols = ['شرح عملیات', 'پیمانکار', 'مرحله انجام مجوز', 'وضعیت اسناد', 'وضعیت برونسپاری', 
              'روش برونسپاری', 'نوع قرارداد', 'برآورد اولیه', 'تاریخ برگزاری', 'شناسه نامه', 'نظرات']
df = df[[c for c in final_cols if c in df.columns]]

# افزودن ستون نظرات اگر وجود ندارد (با مقدار خالی)
if 'نظرات' not in df.columns:
    df['نظرات'] = ""

# --- 2. اتصال به گوگل شیت ---
print("☁️ در حال اتصال به گوگل...")
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
try:
    # خواندن credentials از فایل
    creds = ServiceAccountCredentials.from_json_keyfile_name(
        '.streamlit/secrets.toml', 
        scope
    )
    # اگر فایل TOML نیست، از JSON استفاده کنید
except:
    try:
        import toml
        secrets = toml.load('.streamlit/secrets.toml')
        creds_dict = dict(secrets["gcp_service_account"])
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
    except Exception as e:
        print(f"❌ خطا در خواندن credentials: {e}")
        print("نکته: مطمئن شوید فایل .streamlit/secrets.toml وجود دارد.")
        exit()

client = gspread.authorize(creds)

try:
    sh = client.open(SPREADSHEET_NAME)
    print(f"✅ اتصال موفق به شیت '{SPREADSHEET_NAME}'")
except:
    print(f"⚠️ شیت '{SPREADSHEET_NAME}' پیدا نشد. در حال ساخت...")
    sh = client.create(SPREADSHEET_NAME)
    print(f"✅ شیت جدید ساخته شد: {sh.url}")

# --- 3. آماده‌سازی شیت‌ها ---
def get_or_create_worksheet(sh, title, rows=100, cols=20):
    try:
        ws = sh.worksheet(title)
        ws.clear()
        print(f"✅ شیت '{title}' پاک شد")
    except:
        ws = sh.add_worksheet(title, rows, cols)
        print(f"✅ شیت '{title}' ساخته شد")
    return ws

ws_main = get_or_create_worksheet(sh, "Main_Data", rows=len(df)+50, cols=len(df.columns)+5)
ws_drop = get_or_create_worksheet(sh, "Dropdowns", rows=100, cols=10)

# --- 4. آپلود داده‌ها ---
print("📤 آپلود داده‌های اصلی...")
ws_main.update([df.columns.values.tolist()] + df.astype(str).values.tolist())

# فریز کردن هدر
try:
    ws_main.freeze(rows=1)
    print("✅ ردیف اول فریز شد")
except:
    print("⚠️ نتوانستم ردیف اول را فریز کنم")

print("📤 آپلود لیست‌های کشویی...")
drop_updates = []
col_letter_map = {} 

for i, (col_name, options) in enumerate(dropdown_data.items()):
    opts = sorted(list(options))
    drop_updates.append({'range': gspread.utils.rowcol_to_a1(1, i+1), 'values': [[col_name]]})
    if opts:
        col_values = [[o] for o in opts]
        drop_updates.append({'range': gspread.utils.rowcol_to_a1(2, i+1), 'values': col_values})
        letter = gspread.utils.rowcol_to_a1(1, i+1)[0]
        rng = f"Dropdowns!{letter}2:{letter}{len(opts)+1}"
        col_letter_map[col_name] = rng

ws_drop.batch_update(drop_updates)

# --- 5. اعمال Data Validation ---
print("✨ اعمال قوانین اعتبارسنجی...")

main_col_indices = {name: i for i, name in enumerate(df.columns)}
requests = []

for col_name, range_str in col_letter_map.items():
    if col_name in main_col_indices:
        col_idx = main_col_indices[col_name]
        grid_range = {
            "sheetId": ws_main.id,
            "startRowIndex": 1,
            "endRowIndex": 1000,
            "startColumnIndex": col_idx,
            "endColumnIndex": col_idx + 1
        }
        condition = {
            "type": "ONE_OF_RANGE",
            "values": [{"userEnteredValue": f"={range_str}"}]
        }
        rule = {"condition": condition, "showCustomUi": True, "strict": False}
        requests.append({"setDataValidation": {"range": grid_range, "rule": rule}})

if requests:
    sh.batch_update({"requests": requests})
    print("✅ قوانین اعتبارسنجی اعمال شد")

try:
    ws_drop.hide()
    print("✅ شیت Dropdowns مخفی شد")
except:
    pass

print("\n" + "="*50)
print("✅ تمام شد! گوگل شیت شما آماده است.")
print(f"🔗 لینک: {sh.url}")
print("="*50)
