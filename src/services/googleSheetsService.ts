import { Contract, SheetsResponse } from '@/types/contract';

// این URL رو بعد از Deploy کردن Apps Script باید جایگزین کنید
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

// نگاشت ستون‌های فارسی به انگلیسی - پشتیبانی از نام‌های کوتاه و بلند
// هر فیلد می‌تواند چندین نام ستون داشته باشد (اولین تطابق استفاده می‌شود)
const FIELD_ALIASES: Record<string, string[]> = {
    'description': ['شرح عملیات', 'شرح عملیات برونسپاری'],
    'contractor': ['پیمانکار'],
    'permitStage': ['مرحله انجام مجوز'],
    'documentStatus': ['وضعیت اسناد', 'آخرین وضعیت اسناد مناقصه / قرارداد'],
    'outsourcingStatus': ['وضعیت برونسپاری', 'آخرین وضعیت برونسپاری'],
    'estimate': ['برآورد اولیه', 'برآورد اولیه (ریال)'],
    'biddingMethod': ['روش برونسپاری'],
    'contractType': ['نوع قرارداد'],
    'holdingDate': ['تاریخ برگزاری'],
    'referenceId': ['شناسه نامه', 'شناسه نامه پیش نویس\n\nشناسه نامه مجوز'],
    'stageCode': ['کد مرحله', ' کد مرحله انجام قرارداد', 'کد مرحله انجام قرارداد'],
    'documentCode': ['کد مدرک'],
    'followUp': ['پیگیری ربیعی'],
    'comments': ['نظرات'],
};

// نگاشت معکوس برای ارسال داده به Google Sheets (استفاده از اولین نام)
const FIELD_TO_PERSIAN: Record<string, string> = {
    'description': 'شرح عملیات',
    'contractor': 'پیمانکار',
    'permitStage': 'مرحله انجام مجوز',
    'documentStatus': 'وضعیت اسناد',
    'outsourcingStatus': 'وضعیت برونسپاری',
    'estimate': 'برآورد اولیه',
    'biddingMethod': 'روش برونسپاری',
    'contractType': 'نوع قرارداد',
    'holdingDate': 'تاریخ برگزاری',
    'referenceId': 'شناسه نامه',
    'comments': 'نظرات',
};

/**
 * پیدا کردن مقدار از داده خام با چندین نام ممکن
 */
function findValue(row: Record<string, any>, possibleKeys: string[]): any {
    for (const key of possibleKeys) {
        if (row[key] !== undefined) {
            return row[key];
        }
    }
    return undefined;
}

/**
 * استخراج کد مرحله از متن وضعیت برونسپاری
 */
function deriveStageCodeFromStatus(outsourcingStatus: string): number {
    if (!outsourcingStatus) return 4; // پیش‌فرض: در حال تهیه

    const status = outsourcingStatus;

    // ابلاغ شده (0)
    if (status.includes('ابلاغ قرارداد') && !status.includes('در حال')) return 0;

    // در حال ابلاغ (1)
    if (status.includes('در حال ابلاغ') || status.includes('برای امضا')) return 1;

    // صدور فرم مجوز / ابلاغ برنده (2)
    if (status.includes('صدور فرم مجوز') || status.includes('ابلاغ برنده') || status.includes('پیش نویس به موسسه')) return 2;

    // در انتظار / بی‌نتیجه (3)
    if (status.includes('انتظار') || status.includes('بی نتیجه') || status.includes('بی‌نتیجه') || status.includes('آماده ارسال')) return 3;

    // در حال تهیه / تایید (4)
    if (status.includes('تعیین تکلیف') || status.includes('بازگشت اسناد') || status.includes('در حال تایید')) return 4;

    // تعیین تکلیف نشده (5)
    if (status.includes('عدم تعیین') || status.includes('دست نگه')) return 5;

    // از برنامه خارج (6)
    if (status.includes('خارج')) return 6;

    return 4; // پیش‌فرض
}

/**
 * تبدیل داده‌های خام Google Sheets به Contract objects
 */
function parseSheetData(rawData: Record<string, any>[]): Contract[] {
    return rawData.map((row, index) => {
        const contract: Record<string, any> = { id: index + 1 };

        for (const [englishKey, persianKeys] of Object.entries(FIELD_ALIASES)) {
            const value = findValue(row, persianKeys);

            if (englishKey === 'estimate') {
                // تبدیل به عدد
                const numValue = typeof value === 'string'
                    ? parseInt(value.replace(/[^\d]/g, ''))
                    : value;
                contract[englishKey] = numValue || 0;
            } else if (englishKey === 'comments') {
                // تبدیل JSON String به Array
                try {
                    contract[englishKey] = value ? JSON.parse(value) : [];
                } catch (e) {
                    console.warn('Error parsing comments JSON:', e);
                    contract[englishKey] = [];
                }
            } else if (englishKey === 'stageCode') {
                // تبدیل کد مرحله به عدد - اگر وجود نداشت، از outsourcingStatus استخراج می‌کنیم
                const numValue = Number(value);
                if (!isNaN(numValue) && value !== undefined && value !== '') {
                    contract[englishKey] = numValue;
                } else {
                    // stageCode را بعداً از outsourcingStatus استخراج می‌کنیم
                    contract[englishKey] = -1; // علامت برای استخراج بعدی
                }
            } else {
                contract[englishKey] = value?.toString() || '';
            }
        }

        // اگر stageCode موجود نبود، از وضعیت برونسپاری استخراج کن
        if (contract['stageCode'] === -1 || contract['stageCode'] === 0) {
            const outsourcingStatus = contract['outsourcingStatus'] as string;
            if (outsourcingStatus) {
                contract['stageCode'] = deriveStageCodeFromStatus(outsourcingStatus);
            } else {
                contract['stageCode'] = 4; // پیش‌فرض
            }
        }

        return contract as Contract;
    });
}

/**
 * دریافت تمام قراردادها از Google Sheets
 */
export async function fetchContracts(): Promise<Contract[]> {
    if (!APPS_SCRIPT_URL) {
        console.error('❌ VITE_APPS_SCRIPT_URL تنظیم نشده است');
        throw new Error('URL اسکریپت گوگل تنظیم نشده است. لطفاً فایل .env.local را بررسی کنید.');
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: SheetsResponse<Record<string, any>[]> = await response.json();

        if (!result.success || !result.data) {
            throw new Error(result.error || 'خطا در دریافت داده‌ها');
        }

        return parseSheetData(result.data);
    } catch (error) {
        console.error('خطا در دریافت داده‌ها:', error);
        throw error;
    }
}

/**
 * بروزرسانی یک سلول در Google Sheets
 */
export async function updateCell(
    row: number,
    col: number,
    value: any
): Promise<void> {
    if (!APPS_SCRIPT_URL) {
        throw new Error('URL اسکریپت گوگل تنظیم نشده است');
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'updateCell',
                row,
                col,
                value,
            }),
        });

        const result: SheetsResponse<null> = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'خطا در بروزرسانی');
        }
    } catch (error) {
        console.error('خطا در بروزرسانی سلول:', error);
        throw error;
    }
}

/**
 * بروزرسانی یک ردیف کامل
 */
export async function updateContract(
    rowIndex: number,
    data: Partial<Contract>
): Promise<void> {
    if (!APPS_SCRIPT_URL) {
        throw new Error('URL اسکریپت گوگل تنظیم نشده است');
    }

    // تبدیل کلیدهای انگلیسی به فارسی
    const persianData: Record<string, any> = {};
    for (const [englishKey, persianKey] of Object.entries(FIELD_TO_PERSIAN)) {
        const value = (data as any)[englishKey];
        if (value !== undefined) {
            // اگر آرایه کامنت‌ها بود، تبدیل به رشته JSON شود
            if (englishKey === 'comments' && Array.isArray(value)) {
                persianData[persianKey] = JSON.stringify(value);
            } else {
                persianData[persianKey] = value;
            }
        }
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'updateRow',
                rowIndex,
                data: persianData,
            }),
        });

        const result: SheetsResponse<null> = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'خطا در بروزرسانی قرارداد');
        }
    } catch (error) {
        console.error('خطا در بروزرسانی قرارداد:', error);
        throw error;
    }
}

/**
 * افزودن قرارداد جدید
 */
export async function addContract(data: Omit<Contract, 'id'>): Promise<void> {
    if (!APPS_SCRIPT_URL) {
        throw new Error('URL اسکریپت گوگل تنظیم نشده است');
    }

    // تبدیل کلیدهای انگلیسی به فارسی
    const persianData: Record<string, any> = {};
    for (const [englishKey, persianKey] of Object.entries(FIELD_TO_PERSIAN)) {
        const value = (data as any)[englishKey];
        if (englishKey === 'comments' && Array.isArray(value)) {
            persianData[persianKey] = JSON.stringify(value);
        } else {
            persianData[persianKey] = value || '';
        }
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'addRow',
                data: persianData,
            }),
        });

        const result: SheetsResponse<null> = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'خطا در افزودن قرارداد');
        }
    } catch (error) {
        console.error('خطا در افزودن قرارداد:', error);
        throw error;
    }
}

/**
 * حذف قرارداد
 */
export async function deleteContract(rowIndex: number): Promise<void> {
    if (!APPS_SCRIPT_URL) {
        throw new Error('URL اسکریپت گوگل تنظیم نشده است');
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'deleteRow',
                rowIndex,
            }),
        });

        const result: SheetsResponse<null> = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'خطا در حذف قرارداد');
        }
    } catch (error) {
        console.error('خطا در حذف قرارداد:', error);
        throw error;
    }
}

/**
 * ادیتور (کاربر با دسترسی ویرایش)
 */
export interface Editor {
    name: string;
    email: string;
}

/**
 * دریافت لیست ادیتورها
 */
export async function fetchEditors(): Promise<Editor[]> {
    if (!APPS_SCRIPT_URL) {
        console.warn('APPS_SCRIPT_URL not set');
        return [];
    }

    try {
        const url = new URL(APPS_SCRIPT_URL);
        url.searchParams.append('action', 'getEditors');

        const response = await fetch(url.toString(), {
            method: 'GET',
        });

        const result: SheetsResponse<Editor[]> = await response.json();

        if (!result.success || !result.data) {
            return [];
        }

        return result.data;
    } catch (error) {
        console.error('خطا در دریافت ادیتورها:', error);
        return [];
    }
}

/**
 * درخواست مدیر
 */
export interface ManagerRequest {
    id: number;
    عنوان: string;
    توضیحات: string;
    تاریخ: string;
    اولویت: string;
    وضعیت: string;
}

/**
 * دریافت درخواست‌های مدیر
 */
export async function fetchManagerRequests(): Promise<ManagerRequest[]> {
    if (!APPS_SCRIPT_URL) {
        return [];
    }

    try {
        const url = new URL(APPS_SCRIPT_URL);
        url.searchParams.append('action', 'getManagerRequests');

        const response = await fetch(url.toString(), {
            method: 'GET',
        });

        const result: SheetsResponse<ManagerRequest[]> = await response.json();

        if (!result.success || !result.data) {
            return [];
        }

        return result.data;
    } catch (error) {
        console.error('خطا در دریافت درخواست‌ها:', error);
        return [];
    }
}

/**
 * افزودن درخواست جدید از مدیر
 */
export async function addManagerRequest(
    title: string,
    description: string,
    priority: string
): Promise<void> {
    if (!APPS_SCRIPT_URL) {
        throw new Error('URL اسکریپت گوگل تنظیم نشده است');
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'addManagerRequest',
                title,
                description,
                priority,
            }),
        });

        const result: SheetsResponse<null> = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'خطا در افزودن درخواست');
        }
    } catch (error) {
        console.error('خطا در افزودن درخواست:', error);
        throw error;
    }
}

/**
 * حذف درخواست مدیر
 */
export async function deleteManagerRequest(requestId: number): Promise<void> {
    if (!APPS_SCRIPT_URL) {
        throw new Error('URL اسکریپت گوگل تنظیم نشده است');
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'deleteManagerRequest',
                requestId,
            }),
        });

        const result: SheetsResponse<null> = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'خطا در حذف درخواست');
        }
    } catch (error) {
        console.error('خطا در حذف درخواست:', error);
        throw error;
    }
}

/**
 * بروزرسانی درخواست مدیر
 */
export async function updateManagerRequest(
    requestId: number,
    data: { title?: string; description?: string; priority?: string; status?: string }
): Promise<void> {
    if (!APPS_SCRIPT_URL) {
        throw new Error('URL اسکریپت گوگل تنظیم نشده است');
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'updateManagerRequest',
                requestId,
                ...data,
            }),
        });

        const result: SheetsResponse<null> = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'خطا در بروزرسانی درخواست');
        }
    } catch (error) {
        console.error('خطا در بروزرسانی درخواست:', error);
        throw error;
    }
}
