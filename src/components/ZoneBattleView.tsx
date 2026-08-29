import React from 'react';
import { 
  Layers, 
  Trophy, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import { SmtRecord, ZoneSummary } from '../types';
import { formatCompactRupiah, formatPct } from '../utils/parser';

interface ZoneBattleViewProps {
  zoneSummaries: ZoneSummary[];
  smtList: SmtRecord[];
  onSelectSmt: (smt: SmtRecord) => void;
  onFilterZone: (zone: string) => void;
}

export const ZoneBattleView: React.FC<ZoneBattleViewProps> = ({
  zoneSummaries,
  smtList,
  onSelectSmt,
  onFilterZone,
}) => {
  return (
    <section className="space-y-6">
      
      {/* Header Bento */}
      <div className="bg-[#118AB2] text-white border-3 border-black rounded-3xl p-5 sm:p-6 bento-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="bg-[#FFE600] text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            Zona Performance Battle
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-display uppercase mt-2">
            Komparasi Zona Lantai SMT Alsut
          </h2>
          <p className="text-xs sm:text-sm opacity-90 mt-1">
            Lihat performa rata-rata sales, total omset Clean & Care, dan rasio status tiap zona.
          </p>
        </div>

        <div className="bg-white/10 border-2 border-black/40 rounded-2xl p-3 text-center sm:min-w-[130px]">
          <span className="text-[10px] font-bold uppercase opacity-80">Total Zona</span>
          <p className="text-3xl font-black font-display">{zoneSummaries.length} Zona</p>
        </div>
      </div>

      {/* Grid of Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zoneSummaries.map((zone, idx) => {
          const zoneMembers = smtList.filter((s) => s.zone === zone.zoneName);
          const isTopZone = idx === 0;

          return (
            <div
              key={zone.zoneName}
              className={`border-3 border-black rounded-3xl p-5 bento-shadow flex flex-col justify-between transition-all ${
                isTopZone ? 'bg-[#FFE600]' : 'bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-xl border-2 border-black uppercase flex items-center gap-1 ${
                      isTopZone ? 'bg-black text-[#FFE600]' : 'bg-gray-100 text-black'
                    }`}
                  >
                    <span>{idx === 0 ? '👑' : `#${idx + 1}`}</span>
                    <span>Rank Zona</span>
                  </span>

                  <span className="text-xs font-black bg-white text-black px-2.5 py-0.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]">
                    {zone.memberCount} SMT
                  </span>
                </div>

                <h3 className="text-2xl font-black font-display text-black uppercase tracking-tight">
                  {zone.zoneName}
                </h3>

                {/* Average Sales Metric */}
                <div className="bg-white border-2 border-black rounded-2xl p-3.5 my-3 shadow-[2px_2px_0px_0px_#000]">
                  <span className="text-[10px] font-bold uppercase text-gray-500">Rata-Rata Capaian Sales:</span>
                  <p className="text-3xl font-black font-display text-emerald-600 leading-none mt-1">
                    {formatPct(zone.avgSalesPct)}
                  </p>
                  
                  <div className="mt-3 pt-2 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs font-black text-black">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block">Polis Furnipro:</span>
                      <span>🛡️ {zone.totalPolis} Polis</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block">Clean & Care:</span>
                      <span className="truncate block">🫧 {formatCompactRupiah(zone.totalComser)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Breakdown Pills */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-black mb-3">
                  <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-md">
                    🏆 {zone.bestPerformerCount} Best
                  </span>
                  <span className="bg-yellow-100 text-yellow-950 border border-yellow-300 px-2 py-0.5 rounded-md">
                    ✅ {zone.safeCount} Safe
                  </span>
                  <span className="bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.5 rounded-md">
                    ⚠️ {zone.warningCount} Warn
                  </span>
                  <span className="bg-rose-100 text-rose-950 border border-rose-300 px-2 py-0.5 rounded-md">
                    🚨 {zone.pantauanCount} Pantau
                  </span>
                </div>

                {/* Zone MVP */}
                <div className="text-xs font-bold text-gray-700 bg-gray-100/80 p-2 rounded-xl border border-gray-300">
                  <span className="text-[10px] uppercase font-black text-gray-500 block">MVP Zona:</span>
                  <span className="text-black font-black">{zone.topSmt}</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t-2 border-black/20 flex items-center justify-between">
                <button
                  onClick={() => onFilterZone(zone.zoneName)}
                  className="w-full py-2 bg-black hover:bg-neutral-800 text-white rounded-xl font-black text-xs uppercase tracking-wider border-2 border-black flex items-center justify-center gap-1.5 transition-all bento-shadow-sm cursor-pointer"
                >
                  <span>Lihat {zone.memberCount} SMT {zone.zoneName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FFE600]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
