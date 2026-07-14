import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, Clipboard, FilePlus } from 'lucide-react';

export default function FileUploader({ onUpload, isLoading, t, loggedInEmail }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  
  // Paste Raw Text state
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteName, setPasteName] = useState('');
  
  const fileInputRef = useRef(null);

  // LISTEN TO GLOBAL CTRL+V FILE PASTE EVENT
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      // Don't intercept if user is typing in the raw text textarea or email input
      if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
        return;
      }
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        addFiles(Array.from(e.clipboardData.files));
        e.preventDefault();
      }
    };
    
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files) => {
    const validFiles = files.filter(file => {
      const name = file.name.lowerCase ? file.name.lowerCase() : file.name.toLowerCase();
      return name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls');
    });

    if (validFiles.length !== files.length) {
      setError("Only Excel (.xlsx, .xls) and CSV files are allowed.");
    } else {
      setError(null);
    }

    setSelectedFiles((prev) => {
      const combined = [...prev, ...validFiles];
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
      return unique;
    });
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Convert raw text data (CSV/TSV) paste to standard file
  const handlePasteSubmit = (e) => {
    e.preventDefault();
    if (!pasteText.trim()) return;

    const baseName = pasteName.trim() || 'pasted_data';
    const formattedName = baseName.toLowerCase().endsWith('.csv') ? baseName : `${baseName}.csv`;
    
    // Create File object directly from string contents
    const file = new File([pasteText], formattedName, { type: 'text/csv' });
    addFiles([file]);

    // Clear inputs
    setPasteText('');
    setPasteName('');
    setShowPasteArea(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError("Please select or paste at least one CSV/Excel file.");
      return;
    }
    onUpload(selectedFiles, loggedInEmail || email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Dropzone & Paste wrapper */}
      <div className="space-y-3">
        <div 
          onDragEnter={handleDrag} 
          onDragOver={handleDrag} 
          onDragLeave={handleDrag} 
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={`relative cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-950/20 scale-[1.01]' 
              : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/30'
          }`}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            multiple 
            accept=".csv, .xlsx, .xls"
            onChange={handleChange}
            className="hidden"
          />
          
          <div className="w-14 h-14 bg-slate-900 group-hover:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-800 transition-colors">
            <Upload className="w-6 h-6 text-slate-300 group-hover:text-slate-100" />
          </div>
          
          <h3 className="font-bold text-slate-200 text-base mb-1">
            {t('uploadTitle')}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-3 leading-relaxed">
            {t('uploadPlaceholder')} or <strong className="text-indigo-400">Ctrl + V</strong> to paste a file directly.
          </p>
          <span className="text-[10px] bg-slate-900 text-slate-400 px-3 py-1 rounded-full font-medium border border-slate-800">
            {t('uploadSubtext')}
          </span>
        </div>

        {/* Alternative Paste Raw Text toggle */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowPasteArea(!showPasteArea)}
            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1 transition-all bg-slate-900/40 border border-slate-800/80 px-3 py-1.5 rounded-lg"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>{showPasteArea ? "Cancel Pasting" : "Paste Raw Text / Table Rows"}</span>
          </button>
        </div>
      </div>

      {/* Paste Raw Text Data Area */}
      {showPasteArea && (
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
            <Clipboard className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
              Paste Spreadsheet Cells (TSV / CSV)
            </h4>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Assign File Name
              </label>
              <input 
                type="text"
                value={pasteName}
                onChange={(e) => setPasteName(e.target.value)}
                placeholder="e.g. sales_data"
                className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Paste contents here (copied from Excel, Sheets, or CSV)
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={5}
                placeholder="id&#9;product&#9;revenue&#10;1&#9;Apples&#9;250&#10;2&#9;Oranges&#9;350"
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
            
            <button
              type="button"
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim()}
              className={`w-full py-2.5 px-4 text-xs font-bold text-white rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !pasteText.trim()
                  ? 'bg-slate-850 text-slate-500 cursor-not-allowed border border-transparent'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-650/15'
              }`}
            >
              <FilePlus className="w-4 h-4" />
              <span>Convert Clipboard Data to File</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-950/50 border border-red-900/50 text-red-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {selectedFiles.map((file, idx) => (
              <div 
                key={file.name}
                className="flex items-center justify-between p-2.5 bg-slate-900/40 border border-slate-800/80 rounded-lg group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-300 truncate leading-none mb-1">
                      {file.name}
                    </p>
                    <p className="text-[9px] text-slate-500 leading-none">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-800/50 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Alert Configuration */}
      {!loggedInEmail && (
        <div className="bg-slate-950/30 border border-slate-900/80 rounded-xl p-4 space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
            {t('emailLabel')}
          </label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 focus:border-transparent transition-all"
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || selectedFiles.length === 0}
        className={`w-full py-3.5 px-6 font-bold text-white rounded-xl shadow-lg cursor-pointer select-none transition-all flex items-center justify-center gap-2 ${
          isLoading || selectedFiles.length === 0
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-650/20 hover:-translate-y-[1px]'
        }`}
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{t('analyzingBtn')}</span>
          </>
        ) : (
          <span>{t('analyzeBtn')}</span>
        )}
      </button>
    </form>
  );
}
