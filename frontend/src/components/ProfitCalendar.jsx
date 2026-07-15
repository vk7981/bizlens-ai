import React, { useState, useEffect } from 'react';
import { getLedger, saveLedgerEntry, deleteLedgerEntry, autoExtractLedger } from '../api/client';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar, FileSpreadsheet, RefreshCw, X, AlertTriangle, Sparkles, Download, CheckCircle } from 'lucide-react';
import Tilt3DCard from './Tilt3DCard';

export default function ProfitCalendar({ sessionId, userEmail }) {
  const [ledger, setLedger] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form inputs
  const [incomeInput, setIncomeInput] = useState('');
  const [expensesInput, setExpensesInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  useEffect(() => {
    if (userEmail) {
      fetchLedger();
    }
  }, [userEmail]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getLedger(userEmail);
      setLedger(res.data);
    } catch (err) {
      setError("Failed to load ledger records.");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (direction) => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
    setCurrentDate(nextDate);
  };

  const formatDateString = (year, month, day) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const handleCellClick = (dateStr) => {
    setSelectedDateStr(dateStr);
    const existing = ledger.find(item => item.date === dateStr);
    if (existing) {
      setIncomeInput(existing.income.toString());
      setExpensesInput(existing.expenses.toString());
      setNotesInput(existing.notes || '');
    } else {
      setIncomeInput('');
      setExpensesInput('');
      setNotesInput('');
    }
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!incomeInput || !expensesInput) {
      setError("Please fill out both Income and Expenses.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const inc = parseFloat(incomeInput) || 0;
      const exp = parseFloat(expensesInput) || 0;

      await saveLedgerEntry(userEmail, selectedDateStr, inc, exp, notesInput);
      setSuccess("Financial record saved successfully!");
      fetchLedger();
      setTimeout(() => setShowModal(false), 800);
    } catch (err) {
      setError("Failed to save ledger entry.");
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteLedgerEntry(entryId);
      fetchLedger();
      setShowModal(false);
    } catch (err) {
      setError("Failed to delete ledger entry.");
    }
  };

  const handleAutoExtract = async () => {
    if (!sessionId) {
      alert("No active file session detected. Please upload files first.");
      return;
    }
    setExtracting(true);
    setError(null);
    try {
      const res = await autoExtractLedger(sessionId, userEmail);
      alert(`AI Extraction completed successfully! Extracted and logged ${res.data.extracted_count} profit data points to your calendar.`);
      fetchLedger();
    } catch (err) {
      alert(err.response?.data?.detail || "AI Extraction failed to identify date/financial columns.");
    } finally {
      setExtracting(false);
    }
  };

  const exportToCSV = () => {
    if (ledger.length === 0) return;
    const headers = ["Date", "Income (Rs)", "Expenses (Rs)", "Profit (Rs)", "Source", "Notes"];
    const rows = ledger.map(r => [r.date, r.income, r.expenses, r.profit, r.source, r.notes]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vantagebi_financial_ledger_${userEmail}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptyPrefixes = Array.from({ length: firstDayIndex }, (_, i) => i);

  return (
    <div className="space-y-6">
      
      {/* Top action block */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span>Interactive Profit Calendar</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            View daily performance. Green denotes net profit, red denotes net loss. Click any day to log manually.
          </p>
        </div>

        <div className="flex gap-2">
          {sessionId && (
            <button
              onClick={handleAutoExtract}
              disabled={extracting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-650/15"
            >
              {extracting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Extracting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Auto-Extract from Files</span>
                </>
              )}
            </button>
          )}

          {ledger.length > 0 && (
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Calendar left, ledger history table bottom */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Calendar Core Block */}
        <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-3xl p-5 shadow-xl glass-panel">
          
          {/* Calendar Header Toggles */}
          <div className="flex items-center justify-between mb-5 border-b border-slate-900 pb-4">
            <span className="font-extrabold text-slate-100 text-sm uppercase tracking-wider">
              {monthName} {year}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleMonthChange(-1)}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMonthChange(1)}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty boxes for offset */}
            {emptyPrefixes.map(idx => (
              <div key={`empty-${idx}`} className="aspect-square bg-slate-950/20 border border-slate-950/10 rounded-xl" />
            ))}

            {/* Days boxes */}
            {daysArray.map(day => {
              const dateStr = formatDateString(year, month, day);
              const data = ledger.find(item => item.date === dateStr);
              
              let cellClass = "bg-slate-900 border border-slate-850 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700";
              let labelClass = "text-[9px] font-bold block mt-1";
              
              if (data) {
                if (data.profit > 0) {
                  cellClass = "bg-emerald-950/45 border border-emerald-900/40 text-emerald-100 hover:bg-emerald-950/70 hover:border-emerald-800/50";
                  labelClass += " text-emerald-400";
                } else if (data.profit < 0) {
                  cellClass = "bg-red-950/45 border border-red-900/40 text-red-100 hover:bg-red-950/70 hover:border-red-800/50";
                  labelClass += " text-red-400";
                } else {
                  cellClass = "bg-slate-950 border border-slate-900 text-slate-400 hover:bg-slate-900";
                  labelClass += " text-slate-500";
                }
              }

              return (
                <button
                  key={day}
                  onClick={() => handleCellClick(dateStr)}
                  className={`aspect-square p-2 rounded-xl transition-all flex flex-col justify-between items-start text-left relative overflow-hidden group cursor-pointer ${cellClass}`}
                >
                  <span className="text-[11px] font-extrabold group-hover:scale-105 transition-transform">
                    {day}
                  </span>
                  
                  {data && (
                    <span className={labelClass}>
                      {data.profit >= 0 ? '+' : ''}₹{Math.abs(data.profit).toLocaleString()}
                    </span>
                  )}
                  {data?.notes && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </Tilt3DCard>

        {/* Ledger History List Table */}
        <div className="bg-surface/50 border border-outline-variant/65 rounded-3xl p-5 shadow-xl glass-panel space-y-4">
          <h4 className="text-sm font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>Complete Ledger History Ledger</span>
          </h4>

          {loading ? (
            <div className="text-center py-6">
              <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block" />
            </div>
          ) : ledger.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-550 space-y-2">
              <p>No transactions logged in your ledger yet.</p>
              <p className="text-[10px] text-slate-600">
                Double click a calendar day or upload CSV financial spreadsheets and click "AI Auto-Extract" to populate records!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Income</th>
                    <th className="py-2.5 px-3">Expenses</th>
                    <th className="py-2.5 px-3">Net Profit</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {ledger.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-900/40 text-slate-200 transition-colors">
                      <td className="py-3 px-3 font-semibold font-mono text-[11px]">{row.date}</td>
                      <td className="py-3 px-3 text-slate-300">₹{row.income.toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-400">₹{row.expenses.toLocaleString()}</td>
                      <td className={`py-3 px-3 font-bold ${row.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.profit >= 0 ? '+' : '-'}₹{Math.abs(row.profit).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          row.source === 'AUTO_FILE' ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-900/30' : 'bg-slate-800 text-slate-350'
                        }`}>
                          {row.source}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 max-w-xs truncate" title={row.notes}>
                        {row.notes || '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteEntry(row.id)}
                          className="p-1 hover:bg-red-950/40 border border-transparent hover:border-red-900/35 rounded text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog for manually creating/modifying record */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-outline-variant/65 rounded-3xl p-6 shadow-2xl glass-panel max-w-sm w-full relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-900 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="text-sm font-extrabold text-slate-100 mb-4 tracking-tight flex items-center gap-1.5">
              <span>Financial Log for {selectedDateStr}</span>
            </h4>

            {error && (
              <div className="bg-red-950/60 border border-red-900/40 text-red-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2 mb-4">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-950/60 border border-emerald-900/40 text-emerald-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2 mb-4">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Income (Rs)
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Expenses (Rs)
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={expensesInput}
                  onChange={(e) => setExpensesInput(e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Custom Notes
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. High retail sales, client contract deposit"
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                {ledger.find(item => item.date === selectedDateStr) && (
                  <button
                    type="button"
                    onClick={() => {
                      const entry = ledger.find(item => item.date === selectedDateStr);
                      if (entry) handleDeleteEntry(entry.id);
                    }}
                    className="flex-1 py-2.5 px-4 text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/20 border border-red-900/30 hover:border-red-800 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-[2] py-2.5 px-4 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
