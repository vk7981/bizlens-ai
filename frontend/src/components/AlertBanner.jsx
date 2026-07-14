import React from 'react';
import { AlertTriangle, TrendingDown, ShoppingBag } from 'lucide-react';

export default function AlertBanner({ alerts, t }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-orange-950/25 border border-orange-900/35 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-start gap-4">
      <div className="w-12 h-12 bg-orange-900/30 rounded-full flex items-center justify-center shrink-0 border border-orange-800/40">
        <AlertTriangle className="w-6 h-6 text-orange-400" />
      </div>
      <div className="space-y-4 flex-1">
        <div>
          <h3 className="font-extrabold text-orange-400 text-base mb-1">
            ⚠️ {alerts.length} {t('urgentWarning')}
          </h3>
          <p className="text-xs text-orange-300/80 leading-relaxed">
            We discovered critical operational or financial risks in your sheets that require immediate attention to prevent loss.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map((alert, idx) => {
            const isRevenue = alert.title.toLowerCase().includes('revenue') || alert.title.toLowerCase().includes('cash');
            return (
              <div 
                key={idx}
                className="bg-slate-900/50 border border-orange-950/50 rounded-xl p-4 space-y-2 hover:border-orange-900/40 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isRevenue ? 'bg-red-950/70 text-red-400 border border-red-900/30' : 'bg-orange-950/70 text-orange-400 border border-orange-900/30'}`}>
                    {isRevenue ? <TrendingDown className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wide leading-tight">
                    {alert.title}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {alert.finding}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
