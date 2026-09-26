import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, Loader2, Check, ArrowRight } from 'lucide-react';
import { aiService, type ParsedTransactionResult } from '../../services/aiService';
import type { Category } from '../../types';
import type { Translations } from '../../constants/translations';

interface SmartAiInputProps {
  categories: Category[];
  onParsed: (results: ParsedTransactionResult[]) => void;
  t: Translations;
}

export const SmartAiInput: React.FC<SmartAiInputProps> = ({
  categories,
  onParsed,
  t,
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBadge, setSuccessBadge] = useState<string | null>(null);

  const recognizerRef = useRef<any>(null);

  // Bersihkan recognition saat unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const handleStartListening = () => {
    setErrorMessage(null);

    if (!aiService.isSpeechSupported()) {
      setErrorMessage(t.aiSpeechError);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    if (isListening && recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    try {
      const recognizer = aiService.createSpeechRecognizer(
        (transcript) => {
          if (transcript.trim()) {
            setInputText(transcript);
            // Otomatis proses kalimat hasil rekaman suara
            processNaturalText(transcript);
          }
        },
        (err) => {
          console.warn('[SmartAiInput] Speech error:', err);
          setIsListening(false);
          if (err.error !== 'no-speech') {
            setErrorMessage(t.aiSpeechError);
            setTimeout(() => setErrorMessage(null), 4000);
          }
        },
        () => {
          setIsListening(false);
        }
      );

      if (recognizer) {
        recognizerRef.current = recognizer;
        recognizer.start();
        setIsListening(true);
      }
    } catch (err) {
      console.warn('[SmartAiInput] Mic start error:', err);
      setIsListening(false);
      setErrorMessage(t.aiSpeechError);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const processNaturalText = async (textToProcess: string) => {
    const text = textToProcess.trim();
    if (!text) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const results = await aiService.parseNaturalTransactions(
        text,
        categories.map((c) => ({ id: c.id, name: c.name }))
      );

      if (results && results.length > 0) {
        onParsed(results);
        setSuccessBadge(
          results.length > 1
            ? `${results.length} transaksi terdeteksi!`
            : t.aiParseSuccess
        );
        setInputText('');
        setTimeout(() => setSuccessBadge(null), 3000);
      } else {
        setErrorMessage(t.aiParseError);
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || t.aiParseError);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl p-3 sm:p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-purple-500/10 border border-emerald-500/20 dark:border-emerald-500/30 space-y-2.5 transition-all">
      {/* Top Bar Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
          <span>Smart Input AI (Multi-Transaksi)</span>
        </div>

        {successBadge && (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full animate-in fade-in">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>{successBadge}</span>
          </span>
        )}
      </div>

      {/* Voice Listening Active Wave (Mobile Friendly) */}
      {isListening ? (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 truncate">
              {t.aiListening}
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartListening}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 flex items-center space-x-1 cursor-pointer shadow-xs active:scale-95"
          >
            <MicOff className="w-3.5 h-3.5" />
            <span>Selesai</span>
          </button>
        </div>
      ) : (
        /* Text & Mic Input Row */
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  processNaturalText(inputText);
                }
              }}
              placeholder="Cth: bakso 10k, bensin 30k qris, mie ayam 7k..."
              disabled={isProcessing}
              className="w-full h-11 pl-3.5 pr-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60"
            />
          </div>

          {/* Microphone Button (Min 44x44px touch target for mobile) */}
          <button
            type="button"
            onClick={handleStartListening}
            disabled={isProcessing}
            title="Bicara dengan suara"
            className="w-11 h-11 min-w-[44px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Mic className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Extract Button */}
          <button
            type="button"
            onClick={() => processNaturalText(inputText)}
            disabled={isProcessing || !inputText.trim()}
            className="h-11 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed shrink-0 shadow-xs"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">{t.aiProcessing}</span>
              </>
            ) : (
              <>
                <span>{t.aiInputButton}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Message banner */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
