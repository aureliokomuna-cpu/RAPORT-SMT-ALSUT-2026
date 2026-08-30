import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Flame,
  ArrowRight,
  Shield,
  Sparkle,
  UserCheck,
  CheckSquare,
  Square
} from 'lucide-react';
import { MonthKey, SmtRecord } from '../types';
import { formatCompactRupiah, formatPct, MONTH_CONFIGS } from '../utils/parser';
import { 
  getCoachingRecord, 
  toggleMonthCoaching, 
  quickIncrementCoaching,
  subscribeToCoachingUpdates, 
  SmtCoachingRecord 
} from '../utils/coachingStorage';

interface SmtCardProps {
  smt: SmtRecord;
  onOpenDetail: (smt: SmtRecord) => void;
}

export const SmtCard: React.FC<SmtCardProps> = ({ smt, onOpenDetail }) => {
  const [coachingData, setCoachingData] = useState<SmtCoachingRecord>(() => 
    getCoachingRecord(smt.nip)
  );

  useEffect(() => {
    setCoachingData(getCoachingRecord(smt.nip));
    const unsubscribe = subscribeToCoachingUpdates(() => {
      setCoachingData(getCoachingRecord(smt.nip));
    });
    return unsubscribe;
  }, [smt.nip]);

  const handleToggleMonthCoaching = (e: React.MouseEvent, monthKey: MonthKey) => {
    e.stopPropagation();
    const updated = toggleMonthCoaching(smt.nip, monthKey);
    setCoachingData({ ...updated });
  };

  const handleQuickCoach = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = quickIncrementCoaching(smt.nip);
    setCoachingData({ ...updated });
  };

  const isTop3 = smt.ytd.rank <= 3;
  const isTop1 = smt.ytd.rank === 1;

  // Badge styling based on evaluation result
  const getEvalBadge = (evalStr: string) => {
    if (evalStr.includes('Best Performer')) {
      return {
        text: '🏆 Best Performer',
        bg: 'bg-[#06D6A0] text-black border-black',
      };
    }
    if (evalStr.includes('Safe')) {
      return {
        text: '✅ Safe Performance',
        bg: 'bg-[#FFE600] text-black border-black',
      };
    }
    if (evalStr.includes('Warning Comser')) {
      return {
        text: '🫧 Warning Comser',
        bg: 'bg-[#93C5FD] text-black border-black',
      };
    }
    if (evalStr.includes('Warning FP')) {
      return {
        text: '🛡️ Warning FP',
        bg: 'bg-[#FDBA74] text-black border-black',
      };
    }
    if (evalStr.includes('Warning All Derivative')) {
      return {
        text: '🛡️⚠️ Warning All Derivative',
        bg: 'bg-[#FFD166] text-black border-black',
      };
    }
    return {
      text: '🚨 Dalam Pantauan',
      bg: 'bg-[#FF3E83] text-white border-black',
    };
  };

  const evalBadge = getEvalBadge(smt.ytd.evaluationResult);

  // Grade color map
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S+': return 'bg-emerald-500 text-white';
      case 'S': return 'bg-[#06D6A0] text-black';
      case 'A': return 'bg-[#3B82F6] text-white';
      case 'B': return 'bg-[#F59E0B] text-black';
      case 'C': return 'bg-[#FB923C] text-black';
      case 'D': return 'bg-[#EF4444] text-white';
      default: return 'bg-gray-300 text-gray-700';
    }
  };

  return (
    <div 
      id={`smt-card-${smt.nip}`}
      className={`bg-white border-3 border-black rounded-3xl p-5 bento-shadow bento-shadow-hover flex flex-col justify-between transition-all relative overflow-hidden group ${
        isTop1 ? 'ring-3 ring-[#FFE600]' : ''
      }`}
    >
      {/* Top Header: Rank + Zone + NIP */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-xl border-2 border-black font-black text-xs uppercase flex items-center gap-1 ${
                smt.ytd.rank === 1
                  ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]'
                  : smt.ytd.rank === 2
                  ? 'bg-slate-200 text-black shadow-[2px_2px_0px_0px_#000]'
                  : smt.ytd.rank === 3
                  ? 'bg-amber-600 text-white shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-black text-white'
              }`}
            >
              {isTop3 && <span>🏆</span>}
              <span>#{smt.ytd.rank}</span>
            </span>

            <span className="bg-[#F0F2F5] text-black border border-black/60 px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-tight">
              {smt.zone}
            </span>
          </div>

          <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-300">
            NIP: {smt.nip}
          </span>
        </div>

        {/* SMT Name & Gen-Z Tag */}
        <div className="mb-3.5">
          <h3 
            onClick={() => onOpenDetail(smt)}
            className="text-xl font-black font-display text-black tracking-tight leading-snug group-hover:text-[#FF3E83] transition-colors cursor-pointer"
          >
            {smt.nama}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[11px] font-extrabold text-purple-700 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              {smt.ytd.genzTag}
            </span>
            <span className="text-[11px] font-black text-black bg-[#FFE600] border border-black px-2 py-0.5 rounded-full">
              Grade {smt.ytd.overallGrade}
            </span>
            {smt.spList && smt.spList.length > 0 && (
              <span className="text-[10px] font-black text-white bg-[#FF3E83] border border-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[1px_1px_0px_0px_#000]">
                <span>🚨</span>
                <span>SP ({smt.spList[0].spLabel})</span>
              </span>
            )}
          </div>
        </div>

        {/* Mini 7-Month Bento Grid: JAN -> JUL */}
        <div className="bg-[#F8F9FA] border-2 border-black rounded-2xl p-2.5 mb-3.5">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Performa Tiap Bulan (SMT 1)
            </span>
            <span className="text-[10px] font-bold text-gray-600">
              Achieved: <strong className="text-black font-black">{smt.ytd.salesAchCount}/7</strong> Bulan
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {MONTH_CONFIGS.map((m) => {
              const monthData = smt.monthly[m.key];
              return (
                <div
                  key={m.key}
                  title={`${m.name}: ${monthData.rawSales} (Grade ${monthData.grade} - ${monthData.vibe})`}
                  className={`border border-black rounded-xl p-1 text-center flex flex-col justify-between transition-transform hover:scale-105 ${
                    monthData.isAchieved ? 'bg-white shadow-[1px_1px_0px_0px_#000]' : 'bg-gray-100/70'
                  }`}
                >
                  <span className="text-[9px] font-black text-gray-500 leading-none">
                    {m.short}
                  </span>
                  <span className="text-[10px] font-black text-black my-0.5 truncate leading-tight">
                    {Math.round(monthData.salesPct)}%
                  </span>
                  <span
                    className={`text-[8px] font-black rounded-md px-1 py-0.2 leading-none border border-black/40 ${getGradeColor(
                      monthData.grade
                    )}`}
                  >
                    {monthData.grade}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Primary YTD Metrics Bar */}
        <div className="space-y-2 mb-3.5">
          <div className="bg-[#F0F2F5] border-2 border-black rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                YTD Sales Ach.
              </span>
              <p className="text-2xl font-black font-display text-black leading-none mt-0.5">
                {smt.ytd.rawSales}
              </p>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Polis FP & Comser
              </span>
              <p className="text-xs font-black text-black mt-0.5">
                🛡️ {smt.ytd.polisCount} Polis • 🫧 {formatCompactRupiah(smt.ytd.comserVal)}
              </p>
            </div>
          </div>

          {/* Achievement Progress Bar */}
          <div className="w-full bg-gray-200 border-2 border-black rounded-full h-3 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all ${
                smt.ytd.salesPct >= 120
                  ? 'bg-[#06D6A0]'
                  : smt.ytd.salesPct >= 100
                  ? 'bg-[#3B82F6]'
                  : smt.ytd.salesPct >= 80
                  ? 'bg-[#FFE600]'
                  : 'bg-[#FF3E83]'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, smt.ytd.salesPct))}%` }}
            />
          </div>
        </div>

        {/* Interactive Coaching Tracker & Checklist Bar */}
        <div className="bg-[#FFFBEB] border-2 border-black rounded-2xl p-2.5 mb-3.5 shadow-[2px_2px_0px_0px_#000]">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-[#FFE600] text-black border border-black flex items-center justify-center font-black text-xs">
                🎯
              </span>
              <span className="text-[11px] font-black uppercase tracking-tight text-gray-800">
                Log Coaching SMT
              </span>
            </div>

            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border border-black ${
              coachingData.totalCount > 0 
                ? 'bg-[#06D6A0] text-black shadow-[1px_1px_0px_0px_#000]' 
                : 'bg-[#FFD166] text-black'
            }`}>
              {coachingData.totalCount > 0 ? `✅ ${coachingData.totalCount}x Dicoaching` : '⚠️ Belum Dicoaching (0x)'}
            </span>
          </div>

          {/* 7-Month Quick Coaching Checkboxes */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-amber-300/80">
            <span className="text-[9px] font-bold text-gray-500 uppercase">Centang Bulan:</span>
            <div className="flex items-center gap-1">
              {MONTH_CONFIGS.map((m) => {
                const isChecked = !!coachingData.checkedMonths[m.key];
                return (
                  <button
                    key={m.key}
                    type="button"
                    title={`Klik untuk centang coaching bulan ${m.name}`}
                    onClick={(e) => handleToggleMonthCoaching(e, m.key)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black border transition-transform hover:scale-110 cursor-pointer ${
                      isChecked
                        ? 'bg-black text-[#FFE600] border-black shadow-[1px_1px_0px_0px_#FFE600]'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-black'
                    }`}
                  >
                    {isChecked ? `✓${m.short[0]}` : m.short[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Evaluation Status + Open Detail Action */}
      <div className="pt-2 border-t-2 border-gray-200 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs font-black px-2.5 py-1 rounded-xl border-2 uppercase tracking-wide truncate ${evalBadge.bg}`}
          >
            {evalBadge.text}
          </span>

          <span className="text-[11px] font-extrabold text-gray-500">
            Aura: <strong className="text-black font-black">{smt.ytd.auraScore.toLocaleString()}</strong>
          </span>
        </div>

        <button
          id={`btn-open-raport-${smt.nip}`}
          onClick={() => onOpenDetail(smt)}
          className="w-full mt-1 py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-xl font-black text-xs uppercase tracking-wider border-2 border-black flex items-center justify-center gap-1.5 transition-all bento-shadow-sm hover:shadow-[3px_3px_0px_0px_#FFE600] cursor-pointer"
        >
          <span>Buka Raport SMT 📋</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#FFE600]" />
        </button>
      </div>
    </div>
  );
};
