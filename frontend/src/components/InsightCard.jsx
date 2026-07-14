import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Database } from 'lucide-react';

export default function InsightCard({ insight, t }) {
  const [showProof, setShowProof] = useState(false);
  
  const rank = insight.rank || 'MEDIUM IMPACT';
  
  const getBadgeColor = (r) => {
    switch (r) {
      case 'HIGH IMPACT': return 'bg-red-950/60 text-red-400 border border-red-900/40';
      case 'MEDIUM IMPACT': return 'bg-amber-950/60 text-amber-400 border border-amber-900/40';
      case 'LOW IMPACT': return 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40';
      default: return 'bg-slate-900 text-slate-300 border border-slate-800';
    }
  };

  let sampleRows = [];
  try {
    if (insight.result_summary && (insight.result_summary.startsWith('[') || insight.result_summary.startsWith('{'))) {
      sampleRows = JSON.parse(insight.result_summary);
      if (!Array.isArray(sampleRows)) {
         sampleRows = [sampleRows];
      }
    }
  } catch(e) {}

  return (
    <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 md:p-6 shadow-xl space-y-4 relative overflow-hidden">
      {/* Glow border light effect */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-right from-transparent via-indigo-500/20 to-transparent" />
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h4 className="font-bold text-slate-100 text-sm md:text-base leading-tight">
          {insight.title}
        </h4>
        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${getBadgeColor(rank)}`}>
          {rank}
        </span>
      </div>

      {/* Main plain language description */}
      <p className="text-xs text-slate-300 leading-relaxed">
        {insight.finding}
      </p>

      {/* Why it matters block */}
      <div className="bg-indigo-950/20 border border-indigo-900/35 rounded-xl p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-indigo-300 leading-relaxed">
          <strong className="font-bold text-indigo-200">{t('whyItMatters')}</strong> {insight.why_it_matters}
        </p>
      </div>

      {/* SQL Proof Collapsible */}
      <div className="border-t border-slate-800/80 pt-3">
        <button
          onClick={() => setShowProof(!showProof)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
        >
          {showProof ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{t('sqlProofBtn')}</span>
        </button>
        
        {showProof && (
          <div className="mt-3 bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-3 font-mono text-[10px] text-slate-300">
            {/* Query */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                <Database className="w-3 h-3 text-indigo-400" />
                <span>Verification Query</span>
              </div>
              <pre className="bg-slate-900/60 p-2.5 rounded border border-slate-900/80 text-indigo-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {insight.sql_proof}
              </pre>
            </div>
            
            {/* Sample Output Table */}
            {sampleRows.length > 0 && (
              <div className="space-y-1">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                  Sample Data Checked
                </div>
                <div className="overflow-x-auto border border-slate-900 rounded bg-slate-900/40">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-[9px] uppercase font-bold">
                        {Object.keys(sampleRows[0]).map((key) => (
                          <th key={key} className="px-3 py-2">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sampleRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-900/40 hover:bg-slate-900/30">
                          {Object.values(row).map((val, cIdx) => (
                            <td key={cIdx} className="px-3 py-1.5 text-slate-300">
                              {val === null || val === undefined ? 'NULL' : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
