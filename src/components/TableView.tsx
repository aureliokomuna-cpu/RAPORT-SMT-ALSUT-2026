import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Search, 
  ArrowUpDown, 
  Eye, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Check
} from 'lucide-react';
import { SmtRecord } from '../types';
import { formatCompactRupiah, formatPct, MONTH_CONFIGS } from '../utils/parser';
import { 
  getCoachingRecord, 
  getAllCoachingRecords, 
  quickIncrementCoaching,
  subscribeToCoachingUpdates, 
  SmtCoachingRecord 
} from '../utils/coachingStorage';

interface TableViewProps {
  smtList: SmtRecord[];
  onSelectSmt: (smt: SmtRecord) => void;
}

export const TableView: React.FC<TableViewProps> = ({ smtList, onSelectSmt }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [coachingMap, setCoachingMap] = useState<Record<string, SmtCoachingRecord>>(() => 
    getAllCoachingRecords()
  );

  useEffect(() => {
    setCoachingMap(getAllCoachingRecords());
    const unsubscribe = subscribeToCoachingUpdates(() => {
      setCoachingMap({ ...getAllCoachingRecords() });
    });
    return unsubscribe;
  }, []);

  const handleQuickCoachRow = (e: React.MouseEvent, nip: string) => {
    e.stopPropagation();
    quickIncrementCoaching(nip);
  };

  const filtered = smtList.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nip.includes(search) ||
      s.zone.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportCsv = () => {
    const headers = [
      'Rank',
      'Zona',
      'NIP',
      'Nama SMT',
      'Jan Sales',
      'Feb Sales',
      'Mar Sales',
      'Apr Sales',
      'Mei Sales',
      'Jun Sales',
      'Jul Sales',
      'YTD Sales %',
      'YTD Polis FP',
      'YTD Clean & Care',
      'Bulan Achieved',
      'Coaching (Kali)',
      'Hasil Evaluasi',
    ];

    const rows = filtered.map((s) => {
      const coachRec = coachingMap[s.nip] || getCoachingRecord(s.nip);
      return [
        s.ytd.rank,
        `"${s.zone}"`,
        `"${s.nip}"`,
        `"${s.nama}"`,
        `"${s.monthly.jan.rawSales}"`,
        `"${s.monthly.feb.rawSales}"`,
        `"${s.monthly.mar.rawSales}"`,
        `"${s.monthly.apr.rawSales}"`,
        `"${s.monthly.may.rawSales}"`,
        `"${s.monthly.jun.rawSales}"`,
        `"${s.monthly.jul.rawSales}"`,
        `"${s.ytd.rawSales}"`,
        s.ytd.polisCount,
        `"${s.ytd.rawComser}"`,
        `${s.ytd.salesAchCount}/7`,
        `${coachRec.totalCount || 0}x`,
        `"${s.ytd.evaluationResult}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Raport_SMT_Alsut_2026_YTD.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (evalResult: string) => {
    if (evalResult.includes('Best Performer')) {
      return 'bg-[#06D6A0] text-black border-black';
    }
    if (evalResult.includes('Safe')) {
      return 'bg-[#FFE600] text-black border-black';
    }
    if (evalResult.includes('Warning Comser')) {
      return 'bg-[#93C5FD] text-black border-black';
    }
    if (evalResult.includes('Warning FP')) {
      return 'bg-[#FDBA74] text-black border-black';
    }
    if (evalResult.includes('Warning All Derivative')) {
      return 'bg-[#FFD166] text-black border-black';
    }
    return 'bg-[#FF3E83] text-white border-black';
  };

  return (
    <div className="bg-white border-3 border-black rounded-3xl p-5 bento-shadow space-y-4">
      
      {/* Top Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-gray-200">
        <div>
          <h2 className="text-xl font-black font-display text-black uppercase">
            Tabel Raport Lengkap SMT Alsut 2026
          </h2>
          <p className="text-xs font-bold text-gray-500">
            Audit komprehensif performa sales, Furnipro, Clean & Care, status coaching, dan evaluasi bulanan
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter cepat tabel..."
              className="pl-8 pr-3 py-1.5 bg-white border-2 border-black rounded-xl text-xs font-semibold placeholder:text-gray-400 focus:outline-none shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFE600] hover:bg-yellow-300 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider bento-shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border-2 border-black rounded-2xl">
        <table className="w-full text-left text-xs border-collapse min-w-[1020px]">
          <thead className="bg-black text-white font-black uppercase text-[11px] tracking-wider sticky top-0">
            <tr>
              <th className="py-3 px-3 border-r border-gray-800 text-center w-12">#</th>
              <th className="py-3 px-3 border-r border-gray-800">Nama SMT & NIP</th>
              <th className="py-3 px-3 border-r border-gray-800">Zona</th>
              {MONTH_CONFIGS.map((m) => (
                <th key={m.key} className="py-3 px-2 border-r border-gray-800 text-center">
                  {m.short}
                </th>
              ))}
              <th className="py-3 px-3 border-r border-gray-800 text-right bg-neutral-900 text-[#FFE600]">
                YTD Sales
              </th>
              <th className="py-3 px-2 border-r border-gray-800 text-center">FP</th>
              <th className="py-3 px-3 border-r border-gray-800 text-right">Comser</th>
              <th className="py-3 px-2 border-r border-gray-800 text-center">Ach</th>
              <th className="py-3 px-2.5 border-r border-gray-800 text-center bg-amber-950 text-[#FFE600]">
                Coaching
              </th>
              <th className="py-3 px-3 border-r border-gray-800">Evaluasi Result</th>
              <th className="py-3 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 font-medium">
            {paginated.map((s, idx) => {
              const coachRec = coachingMap[s.nip] || getCoachingRecord(s.nip);
              const coachCount = coachRec.totalCount || 0;

              return (
                <tr 
                  key={s.id} 
                  className={`hover:bg-yellow-50/80 transition-colors ${
                    idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'
                  }`}
                >
                  <td className="py-2.5 px-3 font-black text-center border-r border-gray-200">
                    <span className="inline-block w-6 h-6 rounded-md bg-black text-white text-[11px] leading-6 font-black">
                      {s.ytd.rank}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 border-r border-gray-200">
                    <span className="font-black text-black block leading-tight">{s.nama}</span>
                    <span className="text-[10px] text-gray-500 font-mono">NIP: {s.nip}</span>
                  </td>
                  <td className="py-2.5 px-3 border-r border-gray-200 font-bold uppercase text-gray-700">
                    {s.zone}
                  </td>
                  {MONTH_CONFIGS.map((m) => {
                    const mData = s.monthly[m.key];
                    return (
                      <td
                        key={m.key}
                        className={`py-2 px-1.5 text-center border-r border-gray-200 font-black ${
                          mData.isAchieved ? 'text-emerald-700 bg-emerald-50/40' : 'text-gray-600'
                        }`}
                      >
                        <div>{mData.rawSales}</div>
                        <span className="text-[9px] px-1 rounded bg-gray-200 text-black font-bold">
                          {mData.grade}
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right font-black text-emerald-700 bg-emerald-50 border-r border-gray-200 font-display text-sm">
                    {s.ytd.rawSales}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold border-r border-gray-200 text-indigo-800">
                    {s.ytd.polisCount}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold border-r border-gray-200 text-teal-800 truncate">
                    {formatCompactRupiah(s.ytd.comserVal)}
                  </td>
                  <td className="py-2.5 px-2 text-center font-black border-r border-gray-200">
                    <span className="bg-gray-100 border border-black/40 px-1.5 py-0.5 rounded text-[11px]">
                      {s.ytd.salesAchCount}/7
                    </span>
                  </td>
                  
                  {/* Coaching Column */}
                  <td className="py-2.5 px-2 text-center border-r border-gray-200">
                    <button
                      type="button"
                      onClick={(e) => handleQuickCoachRow(e, s.nip)}
                      title={`Klik untuk tambah log coaching untuk ${s.nama}`}
                      className={`px-2 py-0.5 rounded-lg border font-black text-[11px] transition-transform hover:scale-105 cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                        coachCount > 0
                          ? 'bg-[#06D6A0] text-black border-black shadow-[1px_1px_0px_0px_#000]'
                          : 'bg-gray-100 text-gray-500 border-gray-300 hover:border-black'
                      }`}
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>{coachCount}x</span>
                    </button>
                  </td>

                  <td className="py-2.5 px-3 border-r border-gray-200">
                    <span
                      className={`inline-block text-[11px] font-black px-2 py-0.5 rounded-lg border uppercase whitespace-nowrap ${getStatusBadge(
                        s.ytd.evaluationResult
                      )}`}
                    >
                      {s.ytd.evaluationResult}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onSelectSmt(s)}
                      className="p-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg border border-black transition-transform hover:scale-105 cursor-pointer"
                      title="Buka Raport SMT"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#FFE600]" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="text-xs font-bold text-gray-600">
          Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filtered.length)} dari {filtered.length} SMT
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border-2 border-black rounded-xl px-2 py-1 text-xs font-black"
          >
            <option value={15}>15 per hal</option>
            <option value={25}>25 per hal</option>
            <option value={50}>50 per hal</option>
            <option value={150}>Semua SMT</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-xl border-2 border-black bg-white disabled:opacity-40 hover:bg-gray-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-black bg-[#FFE600] border-2 border-black rounded-xl">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-xl border-2 border-black bg-white disabled:opacity-40 hover:bg-gray-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
