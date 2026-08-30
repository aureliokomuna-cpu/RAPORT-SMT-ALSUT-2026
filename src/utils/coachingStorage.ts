import { MonthKey } from '../types';

export interface CoachingLog {
  id: string;
  date: string;
  topic: string;
  notes?: string;
  coachName?: string;
}

export interface SmtCoachingRecord {
  nip: string;
  checkedMonths: Record<MonthKey, boolean>;
  customLogs: CoachingLog[];
  totalCount: number;
}

const STORAGE_KEY = 'alsut_smt_coaching_v1';

// In-memory fallback / cache
let memoryStorage: Record<string, SmtCoachingRecord> = {};

// Custom event for cross-component reactive updates
const COACHING_UPDATE_EVENT = 'alsut_coaching_updated';

const getDefaultRecord = (nip: string): SmtCoachingRecord => ({
  nip,
  checkedMonths: {
    jan: false,
    feb: false,
    mar: false,
    apr: false,
    may: false,
    jun: false,
    jul: false,
  },
  customLogs: [],
  totalCount: 0,
});

const loadAllRecords = (): Record<string, SmtCoachingRecord> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        memoryStorage = JSON.parse(data);
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

const calculateTotal = (record: SmtCoachingRecord): number => {
  const monthCount = Object.values(record.checkedMonths).filter(Boolean).length;
  const customCount = record.customLogs ? record.customLogs.length : 0;
  return monthCount + customCount;
};

export const getCoachingRecord = (nip: string): SmtCoachingRecord => {
  const records = loadAllRecords();
  if (!records[nip]) {
    return getDefaultRecord(nip);
  }
  const r = records[nip];
  // Ensure all keys exist
  const completeRecord: SmtCoachingRecord = {
    nip,
    checkedMonths: {
      jan: !!r.checkedMonths?.jan,
      feb: !!r.checkedMonths?.feb,
      mar: !!r.checkedMonths?.mar,
      apr: !!r.checkedMonths?.apr,
      may: !!r.checkedMonths?.may,
      jun: !!r.checkedMonths?.jun,
      jul: !!r.checkedMonths?.jul,
    },
    customLogs: Array.isArray(r.customLogs) ? r.customLogs : [],
    totalCount: 0,
  };
  completeRecord.totalCount = calculateTotal(completeRecord);
  return completeRecord;
};

export const toggleMonthCoaching = (nip: string, month: MonthKey): SmtCoachingRecord => {
  const records = loadAllRecords();
  const current = getCoachingRecord(nip);
  
  current.checkedMonths[month] = !current.checkedMonths[month];
  current.totalCount = calculateTotal(current);

  records[nip] = current;
  saveAllRecords(records);
  return current;
};

export const setMonthCoaching = (nip: string, month: MonthKey, checked: boolean): SmtCoachingRecord => {
  const records = loadAllRecords();
  const current = getCoachingRecord(nip);
  
  current.checkedMonths[month] = checked;
  current.totalCount = calculateTotal(current);

  records[nip] = current;
  saveAllRecords(records);
  return current;
};

export const addCustomCoachingLog = (
  nip: string,
  topic: string,
  notes: string = '',
  coachName: string = 'SPV Store Alsut'
): SmtCoachingRecord => {
  const records = loadAllRecords();
  const current = getCoachingRecord(nip);

  const newLog: CoachingLog = {
    id: `coach_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    topic: topic || 'Coaching Rutin Bulanan',
    notes,
    coachName,
  };

  current.customLogs = [newLog, ...current.customLogs];
  current.totalCount = calculateTotal(current);

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

  // Find first unchecked month, or add a custom log
  const months: MonthKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul'];
  const uncheckedMonth = months.find((m) => !current.checkedMonths[m]);

  if (uncheckedMonth) {
    current.checkedMonths[uncheckedMonth] = true;
  } else {
    const newLog: CoachingLog = {
      id: `coach_${Date.now()}`,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      topic: 'Sesi Coaching Tambahan',
      notes: 'Coaching performa dan evaluasi sales',
      coachName: 'SPV Store Alsut',
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
