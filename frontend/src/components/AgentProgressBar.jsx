import React from 'react';

export default function AgentProgressBar({ progress, logs, queriesCount, insightsCount, t }) {
  const phases = ['SCHEMA', 'HYPOTHESES', 'INVESTIGATION', 'RANKING', 'REPORT'];
  const phaseLabels = [
    t('step1Title'),
    t('step2Title'),
    t('totalQueries'),
    t('settingsTitle'),
    'Compilation'
  ];

  const getPhaseIndex = (p) => phases.indexOf(p);
  const activeIdx = getPhaseIndex(progress.phase);

  return (
    <div className="space-y-6">
      {/* Visual Pipeline Stepper */}
      <div className="grid grid-cols-5 gap-2 text-center bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 shadow-lg">
        {['Schema', 'Hypotheses', 'Queries', 'Ranking', 'Report'].map((name, i) => {
          const isCompleted = i < activeIdx;
          const isActive = i === activeIdx;
          
          return (
            <div key={name} className="space-y-2">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-indigo-500' : isActive ? 'bg-indigo-500 animate-pulse' : 'bg-slate-800'
              }`} />
              <span className={`text-[9px] uppercase font-bold tracking-wider block transition-colors ${
                isCompleted || isActive ? 'text-indigo-400' : 'text-slate-500'
              }`}>
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Terminal Output */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-[10px] font-mono text-slate-500 ml-2">BizLens AI Detective Agent</span>
          </div>
          <div className="flex gap-4 font-mono text-[9px] text-slate-400">
            <span>QUERIES: <strong className="text-slate-200">{queriesCount}</strong></span>
            <span>FINDINGS: <strong className="text-slate-200">{insightsCount}</strong></span>
          </div>
        </div>

        {/* Live Rolling Logs Console */}
        <div className="p-4 h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-2.5 bg-slate-950/40">
          {logs.map((log, index) => {
            const isSystem = log.sender === 'system';
            const isSql = log.sender === 'sql';
            
            return (
              <div key={index} className={`flex items-start gap-2 ${
                isSql ? 'text-indigo-300 bg-slate-900/30 p-2 rounded-lg border border-slate-900/60' : ''
              }`}>
                <span className={`font-bold select-none text-[9px] uppercase px-1.5 py-0.5 rounded shrink-0 ${
                  isSystem 
                    ? 'bg-slate-800/80 text-slate-400 border border-slate-700/30' 
                    : isSql 
                      ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-900/40' 
                      : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40'
                }`}>
                  {log.sender}
                </span>
                <span className="whitespace-pre-line leading-relaxed text-slate-300">
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
