import { MonthKey } from '../types';

export type WeekKey = 'w1' | 'w2' | 'w3' | 'w4';
export const WEEKS: WeekKey[] = ['w1', 'w2', 'w3', 'w4'];
export type CoachingCategory = 'sales' | 'furnipro' | 'comser';

export interface CoachingAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'pdf';
  dataUrl: string; // base64 representation
  sizeFormatted?: string;
  uploadedAt: string;
  driveUrl?: string; // Optional Google Drive link for this specific file
}

export interface CoachingLog {
  id: string;
  date: string;
  month?: MonthKey;
  week?: WeekKey;
  topic: string;
  notes?: string;
  coachName?: string;
  salesChecked?: boolean;
  furniproChecked?: boolean;
  comserChecked?: boolean;
  letterNumber?: string; // Surat Komitmen / Memo
  driveUrl?: string; // Link Google Drive dokumen/surat komitmen
  attachments?: CoachingAttachment[];
}

export type MonthlyWeekChecks = Record<WeekKey, boolean>;

export interface SmtCoachingRecord {
  nip: string;
  // Weekly checklists per month for all 3 core metrics
  checkedWeeks: Record<MonthKey, MonthlyWeekChecks>; // Sales Coaching
  checkedFurniproWeeks: Record<MonthKey, MonthlyWeekChecks>; // Furnipro Coaching
  checkedComserWeeks: Record<MonthKey, MonthlyWeekChecks>; // Comser Coaching
  customLogs: CoachingLog[];
  totalCount: number; // Total weekly sessions
  driveUrl?: string; // Google Drive folder khusus SMT ini
  lastAutoSavedAt?: string;
}

export interface CoachingDraft {
  topic: string;
  notes: string;
  letterNumber: string;
  driveUrl: string;
  month: MonthKey;
  week: WeekKey;
  salesChecked: boolean;
  furniproChecked: boolean;
  comserChecked: boolean;
  lastSavedAt: string;
}

const STORAGE_KEY = 'alsut_smt_coaching_v3';
const LEGACY_STORAGE_V2 = 'alsut_smt_coaching_v2';
const LEGACY_STORAGE_V1 = 'alsut_smt_coaching_v1';
const STORAGE_DRIVE_KEY = 'alsut_gdrive_folder_url';
const DRAFT_PREFIX = 'alsut_coaching_draft_';

// Default Google Drive folder for Store Alsut Coaching Documents
export const DEFAULT_GDRIVE_URL = 'https://drive.google.com/drive/folders/1Alsut-SMT-Coaching-Dokumen-2026?usp=sharing';

// Custom event for cross-component reactive updates
const COACHING_UPDATE_EVENT = 'alsut_coaching_updated';

// In-memory cache
let memoryStorage: Record<string, SmtCoachingRecord> = {};

// ==========================================
// IndexedDB Engine (Unlimited quota for documents & attachments)
// ==========================================
const DB_NAME = 'alsut_coaching_db';
const DB_VERSION = 1;
const STORE_RECORDS = 'coaching_records';
const STORE_SETTINGS = 'settings';

function openCoachingDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        db.createObjectStore(STORE_RECORDS, { keyPath: 'nip' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveRecordToIdb(record: SmtCoachingRecord): Promise<void> {
  try {
    const db = await openCoachingDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RECORDS, 'readwrite');
      const store = tx.objectStore(STORE_RECORDS);
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveRecord error:', err);
  }
}

async function getAllRecordsFromIdb(): Promise<Record<string, SmtCoachingRecord>> {
  try {
    const db = await openCoachingDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_RECORDS, 'readonly');
      const store = tx.objectStore(STORE_RECORDS);
      const req = store.getAll();
      req.onsuccess = () => {
        const result: Record<string, SmtCoachingRecord> = {};
        if (Array.isArray(req.result)) {
          req.result.forEach((rec) => {
            if (rec && rec.nip) result[rec.nip] = rec;
          });
        }
        resolve(result);
      };
      req.onerror = () => resolve({});
    });
  } catch (err) {
    console.warn('IndexedDB getAll error:', err);
    return {};
  }
}

// Background sync from IndexedDB on startup
if (typeof window !== 'undefined' && window.indexedDB) {
  setTimeout(() => {
    getAllRecordsFromIdb().then((idbRecords) => {
      if (Object.keys(idbRecords).length > 0) {
        let changed = false;
        for (const nip in idbRecords) {
          const idbRec = idbRecords[nip];
          const memRec = memoryStorage[nip];
          // If IndexedDB has logs/attachments that memory/localStorage didn't have
          const idbLogCount = idbRec.customLogs?.length || 0;
          const memLogCount = memRec?.customLogs?.length || 0;
          if (!memRec || idbLogCount >= memLogCount) {
            memoryStorage[nip] = idbRec;
            changed = true;
          }
        }
        if (changed) {
          window.dispatchEvent(new CustomEvent(COACHING_UPDATE_EVENT));
        }
      }
    }).catch((e) => console.warn('IDB init error:', e));
  }, 100);
}

// ==========================================
// Google Drive URL Helpers
// ==========================================
export const getGoogleDriveUrl = (): string => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_DRIVE_KEY);
      if (stored && stored.trim()) return stored.trim();
    }
  } catch (e) {}
  return DEFAULT_GDRIVE_URL;
};

export const setGoogleDriveUrl = (url: string): void => {
  try {
    const trimmed = url.trim() || DEFAULT_GDRIVE_URL;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_DRIVE_KEY, trimmed);
      window.dispatchEvent(new CustomEvent(COACHING_UPDATE_EVENT));
    }
  } catch (e) {}
};

export const getSmtDriveUrl = (nip: string): string => {
  const rec = getCoachingRecord(nip);
  return rec.driveUrl || getGoogleDriveUrl();
};

export const setSmtDriveUrl = (nip: string, url: string): SmtCoachingRecord => {
  const records = loadAllRecords();
  const current = getCoachingRecord(nip);
  current.driveUrl = url.trim();
  records[nip] = current;
  saveAllRecords(records);
  return current;
};

// ==========================================
// Image Compression / Processing Helper
// ==========================================
export const compressImageFile = (
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(e.target?.result as string); // fallback to raw
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const processAndCompressFile = async (
  file: File
): Promise<CoachingAttachment> => {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  let dataUrl: string;
  let formattedSize: string;

  if (isImage) {
    dataUrl = await compressImageFile(file, 1280, 0.82);
    const sizeInKb = Math.round((dataUrl.length * 3) / 4 / 1024);
    formattedSize = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;
  } else {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const sizeInKb = Math.round(file.size / 1024);
    formattedSize = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;
  }

  return {
    id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: file.name,
    type: isImage ? 'image' : isPdf ? 'pdf' : 'document',
    dataUrl,
    sizeFormatted: formattedSize,
    uploadedAt: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
  };
};

// ==========================================
// Draft Auto-Save Helpers
// ==========================================
export const saveCoachingDraft = (nip: string, draft: Partial<CoachingDraft>): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(
        `${DRAFT_PREFIX}${nip}`,
        JSON.stringify({
          ...draft,
          lastSavedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        })
      );
    }
  } catch (e) {}
};

export const getCoachingDraft = (nip: string): CoachingDraft | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(`${DRAFT_PREFIX}${nip}`);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
};

export const clearCoachingDraft = (nip: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`${DRAFT_PREFIX}${nip}`);
    }
  } catch (e) {}
};

// ==========================================
// Core Defaults & Math
// ==========================================
export const ALL_MONTH_KEYS: MonthKey[] = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

export const getDefaultWeeks = (): MonthlyWeekChecks => ({
  w1: false,
  w2: false,
  w3: false,
  w4: false,
});

export const getDefaultRecord = (nip: string): SmtCoachingRecord => {
  const checkedWeeks = {} as Record<MonthKey, MonthlyWeekChecks>;
  const checkedFurniproWeeks = {} as Record<MonthKey, MonthlyWeekChecks>;
  const checkedComserWeeks = {} as Record<MonthKey, MonthlyWeekChecks>;

  ALL_MONTH_KEYS.forEach((m) => {
    checkedWeeks[m] = getDefaultWeeks();
    checkedFurniproWeeks[m] = getDefaultWeeks();
    checkedComserWeeks[m] = getDefaultWeeks();
  });

  return {
    nip,
    checkedWeeks,
    checkedFurniproWeeks,
    checkedComserWeeks,
    customLogs: [],
    totalCount: 0,
    driveUrl: '',
    lastAutoSavedAt: undefined,
  };
};

const calculateTotal = (record: SmtCoachingRecord): number => {
  let sessionWeeks = 0;
  for (const m of ALL_MONTH_KEYS) {
    const sWeeks = record.checkedWeeks[m];
    const fWeeks = record.checkedFurniproWeeks[m];
    const cWeeks = record.checkedComserWeeks[m];
    for (const w of WEEKS) {
      if ((sWeeks && sWeeks[w]) || (fWeeks && fWeeks[w]) || (cWeeks && cWeeks[w])) {
        sessionWeeks++;
      }
    }
  }
  const customCount = record.customLogs ? record.customLogs.length : 0;
  return Math.max(sessionWeeks, customCount);
};

// ==========================================
// Persistence Logic with IndexedDB + LocalStorage Sync
// ==========================================
const loadAllRecords = (): Record<string, SmtCoachingRecord> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        memoryStorage = JSON.parse(data);
        return memoryStorage;
      }

      // Check legacy migration from v2
      const legacyV2 = localStorage.getItem(LEGACY_STORAGE_V2);
      if (legacyV2) {
        const legacy: Record<string, any> = JSON.parse(legacyV2);
        const migrated: Record<string, SmtCoachingRecord> = {};
        for (const nip in legacy) {
          const rec = getDefaultRecord(nip);
          if (legacy[nip].checkedWeeks) {
            rec.checkedWeeks = legacy[nip].checkedWeeks;
            rec.checkedFurniproWeeks = JSON.parse(JSON.stringify(legacy[nip].checkedWeeks));
            rec.checkedComserWeeks = JSON.parse(JSON.stringify(legacy[nip].checkedWeeks));
          }
          rec.customLogs = legacy[nip].customLogs || [];
          rec.totalCount = calculateTotal(rec);
          migrated[nip] = rec;
        }
        memoryStorage = migrated;
        saveAllRecords(migrated);
        return memoryStorage;
      }
    }
  } catch (e) {
    console.warn('Error loading coaching storage:', e);
  }
  return memoryStorage;
};

const saveAllRecords = (records: Record<string, SmtCoachingRecord>) => {
  memoryStorage = records;
  
  // 1. Asynchronously save all records to IndexedDB (virtually unlimited quota!)
  if (typeof window !== 'undefined' && window.indexedDB) {
    Object.values(records).forEach((rec) => {
      saveRecordToIdb(rec).catch(() => {});
    });
  }

  // 2. Attempt to save to localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      window.dispatchEvent(new CustomEvent(COACHING_UPDATE_EVENT));
    }
  } catch (e) {
    console.warn('LocalStorage quota reached or warning, falling back to light mirror:', e);
    // Graceful fallback for localStorage 5MB limit:
    // Strip large dataUrl from localStorage copy, while IndexedDB & memory keep the full base64!
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const sanitized: Record<string, SmtCoachingRecord> = {};
        for (const nip in records) {
          const rec = records[nip];
          sanitized[nip] = {
            ...rec,
            customLogs: rec.customLogs.map((log) => ({
              ...log,
              attachments: log.attachments?.map((att) => ({
                ...att,
                dataUrl: att.dataUrl.length > 50000 ? '' : att.dataUrl // keep small files or metadata
              }))
            }))
          };
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        window.dispatchEvent(new CustomEvent(COACHING_UPDATE_EVENT));
      }
    } catch (e2) {
      console.warn('LocalStorage write skipped, data is safe in IndexedDB:', e2);
      window.dispatchEvent(new CustomEvent(COACHING_UPDATE_EVENT));
    }
  }
};

export const getCoachingRecord = (nip: string): SmtCoachingRecord => {
  const records = loadAllRecords();
  if (!records[nip]) {
    return getDefaultRecord(nip);
  }
  const r = records[nip];
  const completeRecord: SmtCoachingRecord = getDefaultRecord(nip);

  for (const m of ALL_MONTH_KEYS) {
    if (r.checkedWeeks && r.checkedWeeks[m]) {
      completeRecord.checkedWeeks[m] = {
        w1: !!r.checkedWeeks[m].w1,
        w2: !!r.checkedWeeks[m].w2,
        w3: !!r.checkedWeeks[m].w3,
        w4: !!r.checkedWeeks[m].w4,
      };
    }
    if (r.checkedFurniproWeeks && r.checkedFurniproWeeks[m]) {
      completeRecord.checkedFurniproWeeks[m] = {
        w1: !!r.checkedFurniproWeeks[m].w1,
        w2: !!r.checkedFurniproWeeks[m].w2,
        w3: !!r.checkedFurniproWeeks[m].w3,
        w4: !!r.checkedFurniproWeeks[m].w4,
      };
    }
    if (r.checkedComserWeeks && r.checkedComserWeeks[m]) {
      completeRecord.checkedComserWeeks[m] = {
        w1: !!r.checkedComserWeeks[m].w1,
        w2: !!r.checkedComserWeeks[m].w2,
        w3: !!r.checkedComserWeeks[m].w3,
        w4: !!r.checkedComserWeeks[m].w4,
      };
    }
  }

  completeRecord.customLogs = Array.isArray(r.customLogs) ? r.customLogs : [];
  completeRecord.totalCount = calculateTotal(completeRecord);
  completeRecord.driveUrl = r.driveUrl || '';
  completeRecord.lastAutoSavedAt = r.lastAutoSavedAt;
  return completeRecord;
};

// ==========================================
// Mutation & Auto-Save Actions
// ==========================================

export const toggleCategoryWeekCoaching = (
  nip: string,
  category: CoachingCategory,
  month: MonthKey,
  week: WeekKey
): SmtCoachingRecord => {
  const records = loadAllRecords();
  const current = getCoachingRecord(nip);

  if (category === 'sales') {
    current.checkedWeeks[month][week] = !current.checkedWeeks[month][week];
  } else if (category === 'furnipro') {
    current.checkedFurniproWeeks[month][week] = !current.checkedFurniproWeeks[month][week];
  } else if (category === 'comser') {
    current.checkedComserWeeks[month][week] = !current.checkedComserWeeks[month][week];
  }

  current.totalCount = calculateTotal(current);
  current.lastAutoSavedAt = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  records[nip] = current;
  saveAllRecords(records);
  return current;
};

export const toggleWeekCoaching = (
  nip: string,
  month: MonthKey,
  week: WeekKey
): SmtCoachingRecord => {
  return toggleCategoryWeekCoaching(nip, 'sales', month, week);
};

export const setMonthAllWeeksCoaching = (
  nip: string,
  category: CoachingCategory,
  month: MonthKey,
  checked: boolean
): SmtCoachingRecord => {
  const records = loadAllRecords();
  const current = getCoachingRecord(nip);

  const targetMap =
    category === 'sales'
      ? current.checkedWeeks
      : category === 'furnipro'
      ? current.checkedFurniproWeeks
      : current.checkedComserWeeks;

  targetMap[month] = {
    w1: checked,
    w2: checked,
    w3: checked,
    w4: checked,
  };
  current.totalCount = calculateTotal(current);
  current.lastAutoSavedAt = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  records[nip] = current;
  saveAllRecords(records);
  return current;
};

export interface AddCoachingLogParams {
  nip: string;
  topic: string;
  notes?: string;
  month?: MonthKey;
  week?: WeekKey;
  coachName?: string;
  salesChecked?: boolean;
  furniproChecked?: boolean;
  comserChecked?: boolean;
  letterNumber?: string;
  driveUrl?: string;
  attachments?: CoachingAttachment[];
}

export const addCustomCoachingLog = (
  paramsOrNip: string | AddCoachingLogParams,
  topic?: string,
  notes: string = '',
  month?: MonthKey,
  week?: WeekKey,
  coachName: string = 'SPV Store Alsut'
): SmtCoachingRecord => {
  const records = loadAllRecords();

  let params: AddCoachingLogParams;
  if (typeof paramsOrNip === 'object') {
    params = paramsOrNip;
  } else {
    params = {
      nip: paramsOrNip,
      topic: topic || 'Coaching Rutin Mingguan',
      notes,
      month,
      week,
      coachName,
    };
  }

  const current = getCoachingRecord(params.nip);

  const newLog: CoachingLog = {
    id: `coach_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    month: params.month,
    week: params.week,
    topic: params.topic || 'Coaching Mingguan SMT',
    notes: params.notes,
    coachName: params.coachName || 'SPV Store Alsut',
    salesChecked: params.salesChecked !== undefined ? params.salesChecked : true,
    furniproChecked: !!params.furniproChecked,
    comserChecked: !!params.comserChecked,
    letterNumber: params.letterNumber,
    driveUrl: params.driveUrl,
    attachments: params.attachments || [],
  };

  // Sync checkboxes if month & week provided
  if (params.month && params.week) {
    if (params.salesChecked) {
      current.checkedWeeks[params.month][params.week] = true;
    }
    if (params.furniproChecked) {
      current.checkedFurniproWeeks[params.month][params.week] = true;
    }
    if (params.comserChecked) {
      current.checkedComserWeeks[params.month][params.week] = true;
    }
  }

  current.customLogs = [newLog, ...current.customLogs];
  current.totalCount = calculateTotal(current);
  current.lastAutoSavedAt = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  records[params.nip] = current;
  saveAllRecords(records);
  clearCoachingDraft(params.nip);
  return current;
};

// Instant Auto-Save of single or multiple attachments
export const autoSaveAttachmentToSmt = async (
  nip: string,
  attachment: CoachingAttachment,
  details?: {
    topic?: string;
    notes?: string;
    letterNumber?: string;
    driveUrl?: string;
    month?: MonthKey;
    week?: WeekKey;
  }
): Promise<SmtCoachingRecord> => {
  const current = getCoachingRecord(nip);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const newLog: CoachingLog = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date: now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    month: details?.month,
    week: details?.week,
    topic: details?.topic || `Upload Dokumen: ${attachment.name}`,
    notes: details?.notes || 'Dokumen / berkas surat komitmen SMT diunggah dan tersimpan otomatis ke database.',
    coachName: 'SPV Store Alsut',
    letterNumber: details?.letterNumber,
    driveUrl: details?.driveUrl,
    salesChecked: true,
    furniproChecked: false,
    comserChecked: false,
    attachments: [attachment],
  };

  current.customLogs = [newLog, ...current.customLogs];
  current.totalCount = calculateTotal(current);
  current.lastAutoSavedAt = timeStr;

  const records = loadAllRecords();
  records[nip] = current;
  saveAllRecords(records);
  await saveRecordToIdb(current);
  return current;
};

export const addAttachmentToLog = (
  nip: string,
  logId: string,
  attachment: CoachingAttachment
): SmtCoachingRecord => {
  const records = loadAllRecords();
  const current = getCoachingRecord(nip);

  current.customLogs = current.customLogs.map((log) => {
    if (log.id === logId) {
      const prevAttachments = log.attachments || [];
      return {
        ...log,
        attachments: [...prevAttachments, attachment],
      };
    }
    return log;
  });

  current.lastAutoSavedAt = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  records[nip] = current;
  saveAllRecords(records);
  return current;
};

export const removeCustomCoachingLog = (nip: string, logId: string): SmtCoachingRecord => {
  const records = loadAllRecords();
  const current = getCoachingRecord(nip);

  current.customLogs = current.customLogs.filter((l) => l.id !== logId);
  current.totalCount = calculateTotal(current);
  current.lastAutoSavedAt = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  records[nip] = current;
  saveAllRecords(records);
  return current;
};

export const quickIncrementCoaching = (nip: string): SmtCoachingRecord => {
  const records = loadAllRecords();
  const current = getCoachingRecord(nip);

  let found = false;
  for (const m of ALL_MONTH_KEYS) {
    for (const w of WEEKS) {
      if (!current.checkedWeeks[m][w]) {
        current.checkedWeeks[m][w] = true;
        current.checkedFurniproWeeks[m][w] = true;
        current.checkedComserWeeks[m][w] = true;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  if (!found) {
    const newLog: CoachingLog = {
      id: `coach_${Date.now()}`,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      topic: 'Sesi Coaching & Evaluasi Mingguan Tambahan',
      notes: 'Coaching komprehensif: Sales, Furnipro & Clean Care',
      coachName: 'SPV Store Alsut',
      salesChecked: true,
      furniproChecked: true,
      comserChecked: true,
      attachments: [],
    };
    current.customLogs = [newLog, ...current.customLogs];
  }

  current.totalCount = calculateTotal(current);
  current.lastAutoSavedAt = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  records[nip] = current;
  saveAllRecords(records);
  return current;
};

export const getAllCoachingRecords = (): Record<string, SmtCoachingRecord> => {
  return loadAllRecords();
};

export const subscribeToCoachingUpdates = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(COACHING_UPDATE_EVENT, callback);
  return () => {
    window.removeEventListener(COACHING_UPDATE_EVENT, callback);
  };
};

export const getCoachingMonthConfigs = () => [
  { key: 'jan' as MonthKey, name: 'Januari' },
  { key: 'feb' as MonthKey, name: 'Februari' },
  { key: 'mar' as MonthKey, name: 'Maret' },
  { key: 'apr' as MonthKey, name: 'April' },
  { key: 'may' as MonthKey, name: 'Mei' },
  { key: 'jun' as MonthKey, name: 'Juni' },
  { key: 'jul' as MonthKey, name: 'Juli' },
  { key: 'aug' as MonthKey, name: 'Agustus' },
  { key: 'sep' as MonthKey, name: 'September', isOngoing: true },
];
