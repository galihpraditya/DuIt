import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  FileUp,
  RefreshCw,
} from 'lucide-react';
import type { Category, Transaction } from '../../types';
import { db } from '../../db/database';
import {
  exportTransactionsToExcel,
  parseExcelFile,
  importTransactionsToDb,
  type ParsedImportRow,
} from '../../services/excelService';
import { exportDatabaseBackup, importDatabaseBackup } from '../../services/backupService';
import { formatIDR, formatDateIndo } from '../../utils/formatters';
import { translations as defaultTranslations, type Language, type Translations } from '../../constants/translations';

interface ExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  onDataChanged: (message?: string) => void;
  lang?: Language;
  t?: Translations;
}

export const ExcelModal: React.FC<ExcelModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  onDataChanged,
  lang = 'id',
  t = defaultTranslations[lang],
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'backup'>('export');
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExportExcel = async () => {
    try {
      setIsProcessing(true);
      // Ambil seluruh data langsung dari Dexie storage agar export mencakup seluruh riwayat tanpa membebani RAM
      const allTransactions = await db.transactions.orderBy('date').reverse().toArray();
      await exportTransactionsToExcel({ transactions: allTransactions, categories });
      setStatusMessage({ type: 'success', text: t.exportSuccessMsg });
    } catch {
      setStatusMessage({ type: 'error', text: t.exportFailedMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const rows = await parseExcelFile(file);
      setParsedRows(rows);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || t.importFailedMsg });
      setParsedRows(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedRows) return;
    setIsProcessing(true);
    try {
      const count = await importTransactionsToDb(parsedRows);
      const msg = t.importSuccessMsg.replace('{count}', String(count));
      setStatusMessage({ type: 'success', text: msg });
      setParsedRows(null);
      setFileName('');
      onDataChanged(msg);
    } catch {
      setStatusMessage({ type: 'error', text: t.importFailedMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackupJson = async () => {
    try {
      await exportDatabaseBackup();
      setStatusMessage({ type: 'success', text: t.backupSuccessMsg });
    } catch {
      setStatusMessage({ type: 'error', text: t.backupFailedMsg });
    }
  };

  const handleRestoreJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const result = await importDatabaseBackup(file);
    setIsProcessing(false);

    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
      onDataChanged(result.message);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const totalExpense = transactions.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-in fade-in duration-200">
      <div className="glass-modal rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t.excelCenterTitle}</h3>
              <p className="text-[11px] text-slate-400">{t.excelCenterDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-6">
          {[
            { id: 'export', label: t.tabExportExcel, icon: Download },
            { id: 'import', label: t.tabImportExcel, icon: Upload },
            { id: 'backup', label: t.tabBackupRestore, icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as 'export' | 'import' | 'backup');
                  setStatusMessage(null);
                }}
                className={`py-3 px-4 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {statusMessage && (
            <div
              className={`p-3.5 text-xs rounded-2xl flex items-center space-x-2.5 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: EXPORT EXCEL */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {t.exportSummaryHeading}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    • {t.exportTxCountLabel} <span className="font-bold">{transactions.length} {t.importRowsCount}</span>
                  </div>
                  <div>
                    • {t.exportCatCountLabel} <span className="font-bold">{categories.length}</span>
                  </div>
                  <div>
                    • {t.exportFormatLabel} <span className="font-bold text-emerald-600">.xlsx (Excel)</span>
                  </div>
                  <div>
                    • {t.exportTotalLabel}{' '}
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {formatIDR(totalExpense, false, lang)}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  {t.exportSheetDesc}
                </p>
              </div>

              <button
                onClick={handleExportExcel}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-transform active:scale-[0.99] disabled:opacity-50"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{isProcessing ? t.exportPreparingBtn : t.exportDownloadBtn}</span>
              </button>
            </div>
          )}

          {/* TAB 2: IMPORT EXCEL */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.importDesc}
              </p>

              {/* Upload Drop Area */}
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-colors">
                <FileUp className="w-8 h-8 text-emerald-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">
                  {fileName || t.importDropzoneTitle}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">{t.importDropzoneHint}</span>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="hidden" />
              </label>

              {/* Parsed Preview */}
              {parsedRows && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {t.importPreviewHeading} ({parsedRows.filter((r) => r.isValid).length} {t.importValidOf} {parsedRows.length}{' '}
                      {t.importRowsCount}):
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0">
                        <tr>
                          <th className="p-2">{t.importColDate}</th>
                          <th className="p-2">{t.importColCategory}</th>
                          <th className="p-2">{t.importColAmount}</th>
                          <th className="p-2">{t.importColNotes}</th>
                          <th className="p-2">{t.importColStatus}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {parsedRows.slice(0, 15).map((row, i) => (
                          <tr key={i} className={row.isValid ? '' : 'bg-rose-50/50 dark:bg-rose-950/30'}>
                            <td className="p-2">{formatDateIndo(row.date, 'dd/MM/yy', lang)}</td>
                            <td className="p-2 font-medium">{row.categoryName}</td>
                            <td className="p-2 font-semibold text-rose-600">{formatIDR(row.amount, false, lang)}</td>
                            <td className="p-2 truncate max-w-[120px]">{row.notes || '-'}</td>
                            <td className="p-2">
                              {row.isValid ? (
                                <span className="text-emerald-600 font-bold">{t.importStatusReady}</span>
                              ) : (
                                <span className="text-rose-500 font-bold">{row.error}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={handleConfirmImport}
                    disabled={isProcessing || parsedRows.filter((r) => r.isValid).length === 0}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-transform active:scale-[0.99] disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {isProcessing
                        ? t.importProcessingBtn
                        : `${t.importSaveBtn} ${parsedRows.filter((r) => r.isValid).length} ${t.transactions}`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {t.backupSectionTitle}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.backupSectionDesc}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleBackupJson}
                  className="py-3 px-4 rounded-2xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center space-x-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.backupDownloadBtn}</span>
                </button>

                <label className="py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.backupRestoreBtn}</span>
                  <input type="file" accept=".json" onChange={handleRestoreJson} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

