import React, { useState, useEffect } from 'react';
import { getSessionSchema, executeSessionQuery } from '../api/client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { BarChart3, TrendingUp, PieChart, RefreshCw, Sparkles, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import Tilt3DCard from './Tilt3DCard';
import axios from 'axios';

// Register Chart.js modules
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function AdvancedVisualizations({ sessionId, userEmail }) {
  const [schema, setSchema] = useState(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [xAxisCol, setXAxisCol] = useState('');
  const [yAxisCol, setYAxisCol] = useState('');
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line' | 'pie' | 'area'
  
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(null);
  
  const [chartData, setChartData] = useState(null);
  const [rawRows, setRawRows] = useState([]);
  
  // AI explanation state
  const [aiExplanation, setAiExplanation] = useState('');
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSchema();
    }
  }, [sessionId]);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSessionSchema(sessionId);
      setSchema(res.data);
      if (res.data.tables && res.data.tables.length > 0) {
        const firstTable = res.data.tables[0];
        setSelectedTable(firstTable.name);
        autoSelectAxes(firstTable);
      }
    } catch (err) {
      setError("Failed to fetch session database tables schema.");
    } finally {
      setLoading(false);
    }
  };

  const autoSelectAxes = (table) => {
    if (!table || !table.columns || table.columns.length === 0) return;
    const cols = table.columns;
    
    // Attempt to locate a date/category column for X
    const dateCol = cols.find(c => c.name.toLowerCase().includes('date') || c.name.toLowerCase().includes('month'));
    const catCol = cols.find(c => c.name.toLowerCase().includes('name') || c.name.toLowerCase().includes('product') || c.name.toLowerCase().includes('category') || c.name.toLowerCase().includes('type'));
    const xSelect = dateCol ? dateCol.name : (catCol ? catCol.name : cols[0].name);
    setXAxisCol(xSelect);
    
    // Attempt to locate a numeric column for Y
    const numCol = cols.find(c => 
      c.type.toUpperCase().includes('INT') || 
      c.type.toUpperCase().includes('REAL') || 
      c.type.toUpperCase().includes('FLOAT') || 
      c.type.toUpperCase().includes('DOUBLE') ||
      c.name.toLowerCase().includes('revenue') || 
      c.name.toLowerCase().includes('amount') || 
      c.name.toLowerCase().includes('total') || 
      c.name.toLowerCase().includes('price') || 
      c.name.toLowerCase().includes('qty') || 
      c.name.toLowerCase().includes('sold')
    );
    const ySelect = numCol ? numCol.name : (cols[1] ? cols[1].name : cols[0].name);
    setYAxisCol(ySelect);
  };

  const handleTableChange = (tableName) => {
    setSelectedTable(tableName);
    const table = schema.tables.find(t => t.name === tableName);
    autoSelectAxes(table);
  };

  // Re-run query and render chart when settings change
  useEffect(() => {
    if (selectedTable && xAxisCol && yAxisCol) {
      renderVisualization();
    }
  }, [selectedTable, xAxisCol, yAxisCol, chartType]);

  const isNumericColumn = (colName) => {
    if (!schema || !selectedTable) return false;
    const table = schema.tables.find(t => t.name === selectedTable);
    if (!table) return false;
    const col = table.columns.find(c => c.name === colName);
    if (!col) return false;
    
    const numTypes = ['INT', 'REAL', 'FLOAT', 'DOUBLE', 'NUMERIC'];
    const nameKeywords = ['revenue', 'amount', 'total', 'price', 'qty', 'sold', 'units', 'cost', 'spend', 'profit', 'income', 'value'];
    
    return numTypes.some(t => col.type.toUpperCase().includes(t)) || 
           nameKeywords.some(kw => col.name.toLowerCase().includes(kw));
  };

  const renderVisualization = async () => {
    setRendering(true);
    setError(null);
    setAiExplanation('');
    
    const yIsNumeric = isNumericColumn(yAxisCol);
    let selectClause = '';
    
    if (yIsNumeric && xAxisCol !== yAxisCol) {
      selectClause = `${xAxisCol} AS label_col, SUM(${yAxisCol}) AS val_col`;
    } else {
      selectClause = `${xAxisCol} AS label_col, COUNT(${yAxisCol}) AS val_col`;
    }

    // Build standard SELECT query with clean grouping
    const sql = `SELECT ${selectClause} FROM \`${selectedTable}\` GROUP BY 1 ORDER BY 2 DESC LIMIT 15;`;

    try {
      const res = await executeSessionQuery(sessionId, sql);
      const rows = res.data.data || [];
      setRawRows(rows);

      if (rows.length === 0) {
        setChartData(null);
        return;
      }

      const labels = rows.map(r => r.label_col || 'N/A');
      const values = rows.map(r => r.val_col || 0);

      // Colors configuration
      const isPie = chartType === 'pie';
      
      const backgroundColors = isPie 
        ? [
            'rgba(99, 102, 241, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(14, 165, 233, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(168, 85, 247, 0.7)',
            'rgba(100, 116, 139, 0.7)',
          ]
        : chartType === 'area'
          ? 'rgba(99, 102, 241, 0.2)' 
          : 'rgba(99, 102, 241, 0.75)';

      const borderColors = isPie
        ? [
            '#6366f1', '#f97316', '#10b981', '#0ea5e9', '#ec4899', '#f59e0b', '#a855f7', '#64748b'
          ]
        : '#818cf8';

      setChartData({
        labels,
        datasets: [
          {
            label: yIsNumeric ? `Sum of ${yAxisCol}` : `Count of ${yAxisCol}`,
            data: values,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 2,
            fill: chartType === 'area',
            tension: 0.35,
          }
        ]
      });

      // Trigger AI Explanation
      explainChartTrends(selectedTable, xAxisCol, yAxisCol, rows);

    } catch (err) {
      setError("SQL query execution failed or table contains unplottable values.");
      setChartData(null);
    } finally {
      setRendering(false);
    }
  };

  const explainChartTrends = async (table, x, y, rows) => {
    setExplaining(true);
    try {
      // Direct call to explanation endpoint
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
      const res = await axios.post(`${cleanBase}/api/chat/explain-trend`, {
        session_id: sessionId,
        table_name: table,
        x_col: x,
        y_col: y,
        data_summary: rows.slice(0, 10)
      });
      setAiExplanation(res.data.explanation);
    } catch (err) {
      // Basic local description fallback
      const topRow = rows[0];
      const bottomRow = rows[rows.length - 1];
      if (topRow && bottomRow) {
        setAiExplanation(`Based on local diagnostics, '${topRow.label_col}' records the highest density with a value of ${topRow.val_col.toLocaleString()}. The baseline registers lowest at '${bottomRow.label_col}' (${bottomRow.val_col.toLocaleString()}).`);
      } else {
        setAiExplanation("No significant trends could be plotted from this visual representation.");
      }
    } finally {
      setExplaining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <span className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] text-slate-500">Mapping database tables and schemas...</p>
      </div>
    );
  }

  const selectedTableObj = schema?.tables?.find(t => t.name === selectedTable);
  const tableColumns = selectedTableObj?.columns || [];

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chartType !== 'pie',
        labels: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: chartType === 'pie' ? {} : {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#64748b', font: { size: 9 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#64748b', font: { size: 9 } }
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <span>Interactive AI Chart Visualizations</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Select any table and columns. The system runs SQLite SELECT queries in real-time and visualizes the results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Selectors (4 cols) */}
        <div className="md:col-span-4 space-y-4">
          <Tilt3DCard className="bg-surface/50 border border-outline-variant/65 rounded-3xl p-5 shadow-xl glass-panel space-y-4">
            
            {/* Table Select */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Table / Sheet
              </label>
              <select
                value={selectedTable}
                onChange={(e) => handleTableChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {schema?.tables?.map(t => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.row_count} rows)
                  </option>
                ))}
              </select>
            </div>

            {/* X Axis Select */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                X-Axis Column (Labels)
              </label>
              <select
                value={xAxisCol}
                onChange={(e) => setXAxisCol(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {tableColumns.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Y Axis Select */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Y-Axis Column (Values)
              </label>
              <select
                value={yAxisCol}
                onChange={(e) => setYAxisCol(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {tableColumns.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
              <span className="text-[9px] text-slate-550 block leading-tight mt-1">
                {isNumericColumn(yAxisCol) 
                  ? "✓ Numeric column detected. Real-time SUM aggregation will be applied." 
                  : "ℹ Text column selected. Row count density will be plotted instead."}
              </span>
            </div>

            {/* Chart Type Toggle */}
            <div className="space-y-2 pt-2 border-t border-slate-900">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Chart Layout
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { type: 'bar', label: 'Bar', icon: BarChart3 },
                  { type: 'line', label: 'Line', icon: TrendingUp },
                  { type: 'area', label: 'Area', icon: TrendingUp },
                  { type: 'pie', label: 'Pie', icon: PieChart }
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = chartType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setChartType(item.type)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                          : 'bg-slate-900 border-slate-800 text-slate-450 hover:border-slate-700 hover:text-slate-350'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[8px] font-bold uppercase">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </Tilt3DCard>
        </div>

        {/* Right column: Chart output & AI explanation (8 cols) */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Chart canvas */}
          <div className="bg-surface/50 border border-outline-variant/65 rounded-3xl p-5 shadow-xl glass-panel min-h-[350px] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Visualizer Output: {selectedTable}
              </span>
              {rendering && <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
            </div>

            <div className="flex-1 relative min-h-[260px] flex items-center justify-center">
              {error ? (
                <div className="text-center text-xs text-red-400 max-w-sm px-4">
                  {error}
                </div>
              ) : !chartData ? (
                <div className="text-center text-xs text-slate-550">
                  Select valid columns to generate the graph.
                </div>
              ) : (
                <div className="absolute inset-0">
                  {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
                  {chartType === 'line' && <Line data={chartData} options={chartOptions} />}
                  {chartType === 'area' && <Line data={chartData} options={chartOptions} />}
                  {chartType === 'pie' && (
                    <div className="max-h-[260px] flex justify-center">
                      <Pie data={chartData} options={chartOptions} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Explanation block */}
          {chartData && (
            <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-3xl p-5 shadow-xl glass-panel relative overflow-hidden flex flex-col gap-3">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl -z-10" />
              <div className="flex items-center gap-1.5 text-indigo-400 font-extrabold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>AI Graph Trend Analyst</span>
              </div>
              
              <div className="text-xs text-slate-300 leading-relaxed min-h-[40px]">
                {explaining ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI is reading chart trends and compiling explanations...</span>
                  </div>
                ) : (
                  <p className="animate-fade-in">{aiExplanation}</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
