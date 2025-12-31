export interface Comment {
  id: string;
  text: string;
  author: string;
  date: string;
}

export interface Contract {
  id: number;
  description: string;              // شرح عملیات برونسپاری
  contractor: string;                // پیمانکار
  permitStage: string;              // مرحله انجام مجوز
  documentStatus: string;           // آخرین وضعیت اسناد مناقصه / قرارداد
  outsourcingStatus: string;        // آخرین وضعیت برونسپاری
  estimate: number;                 // برآورد اولیه (ریال)
  biddingMethod: string;            // روش برونسپاری
  contractType: string;             // نوع قرارداد
  holdingDate: string;              // تاریخ برگزاری
  referenceId: string;              // شناسه نامه
  stageCode: number;                // کد مرحله انجام قرارداد
  documentCode: string;             // کد مدرک
  followUp: string;                 // پیگیری ربیعی
  comments: Comment[];              // نظرات
}

export interface DropdownOptions {
  'مرحله انجام مجوز': string[];
  'وضعیت اسناد': string[];
  'وضعیت برونسپاری': string[];
  'روش برونسپاری': string[];
  'نوع قرارداد': string[];
}

export interface SheetsResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}

