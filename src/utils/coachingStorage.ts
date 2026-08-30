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
}

const STORAGE_KEY = 'alsut_smt_coaching_v3';
const LEGACY_STORAGE_V2 = 'alsut_smt_coaching_v2';
const LEGACY_STORAGE_V1 = 'alsut_smt_coaching_v1';

// In-memory fallback / cache
let memoryStorage: Record<string, SmtCoachingRecord> = {};

// Custom event for cross-component reactive updates
const COACHING_UPDATE_EVENT = 'alsut_coaching_updated';

export const ALL_MONTH_KEYS: MonthKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul'];

export const getDefaultWeeks = (): MonthlyWeekChecks => ({
  w1: false,
  w2: false,
  w3: false,
  w4: false,
});

export const getDefaultRecord = (nip: string): SmtCoachingRecord => ({
  nip,
  checkedWeeks: {
    jan: getDefaultWeeks(),
    feb: getDefaultWeeks(),
    mar: getDefaultWeeks(),
    apr: getDefaultWeeks(),
    may: getDefaultWeeks(),
    jun: getDefaultWeeks(),
    jul: getDefaultWeeks(),
  },
  checkedFurniproWeeks: {
    jan: getDefaultWeeks(),
    feb: getDefaultWeeks(),
    mar: getDefaultWeeks(),
    apr: getDefaultWeeks(),
    may: getDefaultWeeks(),
    jun: getDefaultWeeks(),
    jul: getDefaultWeeks(),
  },
  checkedComserWeeks: {
    jan: getDefaultWeeks(),
    feb: getDefaultWeeks(),
    mar: getDefaultWeeks(),
    apr: getDefaultWeeks(),
    may: getDefaultWeeks(),
    jun: getDefaultWeeks(),
    jul: getDefaultWeeks(),
  },
  customLogs: [],
  totalCount: 0,
});

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

const loadAllRecords = (): Record<string, SmtCoachingRecord> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        memoryStorage = JSON.parse(data);
        return memoryStorage;
      }

      // Check legacy migration from v2 or v1
      const legacyV2 = localStorage.getItem(LEGACY_STORAGE_V2);
      if (legacyV2) {
        const legacy: Record<string, any> = JSON.parse(legacyV2);
        const migrated: Record<string, SmtCoachingRecord> = {};
        for (const nip in legacy) {
          const rec = getDefaultRecord(nip);
          if (legacy[nip].checkedWeeks) {
            rec.checkedWeeks = legacy[nip].checkedWeeks;
            // Mirror some initial checks for consistency
            rec.checkedFurniproWeeks = JSON.parse(JSON.stringify(legacy[nip].checkedWeeks));
            rec.checkedComserWeeks = JSON.parse(JSON.stringify(legacy[nip].checkedWeeks));
          }
          rec.customLogs = legacy[nip].customLogs || [];
          rec.totalCount = calculateTotal(rec);
          migrated[nip] = rec;
        }
        memoryStorage = migrated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
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
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      window.dispatchEvent(new CustomEvent(COACHING_UPDATE_EVENT));
    }
  } catch (e) {
    console.warn('Error saving coaching storage:', e);
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
  return completeRecord;
};

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
  records[nip] = current;
  saveAllRecords(records);
  return current;
};

// Backward-compatible alias for sales week toggle
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

  records[params.nip] = current;
  saveAllRecords(records);
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

  records[nip] = current;
  saveAllRecords(records);
  return current;
};

export const removeCustomCoachingLog = (nip: string, logId: string): SmtCoachingRecord => {
  const records = loadAllRecords();
  const current = getCoachingRecord(nip);

  current.customLogs = current.customLogs.filter((l) => l.id !== logId);
  current.totalCount = calculateTotal(current);

  records[nip] = current;
  saveAllRecords(records);
  return current;
};

export const quickIncrementCoaching = (nip: string): SmtCoachingRecord => {
  const records = loadAllRecords();
  const current = getCoachingRecord(nip);

  // Find first unchecked week in the months
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
