import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, Search, X, Terminal, Copy, Check, RotateCcw, ArrowDown, Circle, Maximize2, Minimize2 } from 'lucide-react';
import type { LogLine, LogLevel } from '@shared/types';

interface StepLogPanelProps {
  stepId: string;
  stepName: string;
  toolId?: string;
  status?: string;
  logLines: LogLine[];
  defaultCollapsed?: boolean;
  autoScroll?: boolean;
}

const LEVEL_STYLES: Record<LogLevel, { text: string; bg: string; dot: string; label: string }> = {
  INFO:    { text: 'text-sky-300',   bg: 'bg-sky-500/10',   dot: 'bg-sky-400',    label: 'INFO' },
  WARN:    { text: 'text-amber-300', bg: 'bg-amber-500/10', dot: 'bg-amber-400',  label: 'WARN' },
  ERROR:   { text: 'text-rose-300',  bg: 'bg-rose-500/10',  dot: 'bg-rose-400',   label: 'ERROR' },
  DEBUG:   { text: 'text-slate-400', bg: 'bg-slate-500/10', dot: 'bg-slate-500',  label: 'DEBUG' },
  SUCCESS: { text: 'text-emerald-300',bg: 'bg-emerald-500/10',dot: 'bg-emerald-400',label: ' OK ' },
};

const LEVEL_FILTERS: { key: LogLevel | 'ALL'; label: string }[] = [
  { key: 'ALL',   label: '全部' },
  { key: 'INFO',  label: '信息' },
  { key: 'WARN',  label: '警告' },
  { key: 'ERROR', label: '错误' },
  { key: 'DEBUG', label: '调试' },
  { key: 'SUCCESS', label: '成功' },
];

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text: string, keyword: string) {
  if (!keyword.trim()) return text;
  try {
    const re = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    const parts = text.split(re);
    return parts.map((part, i) =>
      re.test(part) ? (
        <mark key={i} className="bg-yellow-400/40 text-yellow-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  } catch {
    return text;
  }
}

export default function StepLogPanel({
  stepId,
  stepName,
  toolId,
  status,
  logLines,
  defaultCollapsed = true,
  autoScroll = true,
}: StepLogPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [showSearch, setShowSearch] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followTail, setFollowTail] = useState(autoScroll);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(logLines.length);
  const userScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredLines = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return logLines.filter(line => {
      if (levelFilter !== 'ALL' && line.level !== levelFilter) return false;
      if (kw && !line.message.toLowerCase().includes(kw) && !line.timestamp.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [logLines, keyword, levelFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: logLines.length };
    logLines.forEach(l => { c[l.level] = (c[l.level] || 0) + 1; });
    return c;
  }, [logLines]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (userScrollingRef.current) {
      setShowScrollButton(!isNearBottom);
      if (isNearBottom) {
        setFollowTail(true);
        userScrollingRef.current = false;
      }
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    setFollowTail(true);
    userScrollingRef.current = false;
    setShowScrollButton(false);
  }, []);

  const handleWheel = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    userScrollingRef.current = true;
    setFollowTail(false);
    scrollTimeoutRef.current = setTimeout(() => {
      handleScroll();
    }, 150);
  }, [handleScroll]);

  useEffect(() => {
    if (!collapsed && followTail && logLines.length > prevCountRef.current && scrollRef.current && !userScrollingRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevCountRef.current = logLines.length;
  }, [logLines, collapsed, followTail]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: true });
      el.addEventListener('touchmove', handleWheel, { passive: true });
      return () => {
        el.removeEventListener('wheel', handleWheel);
        el.removeEventListener('touchmove', handleWheel);
      };
    }
  }, [handleWheel, collapsed]);

  useEffect(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    const text = logLines.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      console.warn('复制失败');
    }
  };

  const handleClear = () => {
    setKeyword('');
    setLevelFilter('ALL');
    setShowSearch(false);
  };

  const statusDot = status === 'running' ? 'bg-emerald-400 animate-pulse' :
                    status === 'completed' ? 'bg-emerald-500' :
                    status === 'failed' ? 'bg-rose-500' :
                    status === 'pending' ? 'bg-slate-500' : 'bg-slate-500';

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-hidden backdrop-blur-sm">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors text-left"
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm truncate">{stepName}</span>
            {toolId && (
              <span className="text-xs font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                {toolId}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span>{logLines.length} 条日志</span>
            {counts.WARN > 0 && <span className="text-amber-400">{counts.WARN} 警告</span>}
            {counts.ERROR > 0 && <span className="text-rose-400">{counts.ERROR} 错误</span>}
          </div>
        </div>
        {collapsed ? (
          <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />
        )}
      </button>

      {!collapsed && (
        <div className="border-t border-slate-700/60">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              {LEVEL_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setLevelFilter(f.key as LogLevel | 'ALL')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    levelFilter === f.key
                      ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {f.label}
                  {counts[f.key] !== undefined && (
                    <span className="ml-1 opacity-60">({counts[f.key]})</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-1.5 rounded-md transition-colors ${
                  showSearch || keyword
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
                title="搜索日志"
              >
                <Search size={14} />
              </button>
              <button
                onClick={() => setFollowTail(!followTail)}
                className={`p-1.5 rounded-md transition-colors ${
                  followTail
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
                title={followTail ? '自动滚动：开启' : '自动滚动：关闭'}
              >
                <Terminal size={14} />
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                title="复制全部日志"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                title="重置筛选条件"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                title={isExpanded ? '恢复默认高度' : '展开日志窗口'}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>

          {showSearch && (
            <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2">
              <Search size={14} className="text-slate-500 flex-shrink-0" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="输入关键词搜索日志..."
                className="flex-1 bg-slate-800/60 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
                autoFocus
              />
              {keyword && (
                <button
                  onClick={() => setKeyword('')}
                  className="p-1 text-slate-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
              <span className="text-xs text-slate-500 font-mono">
                {filteredLines.length}/{logLines.length}
              </span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-b from-slate-800/80 to-slate-900/80 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Circle size={11} className="text-rose-400 fill-current" />
                <Circle size={11} className="text-amber-400 fill-current" />
                <Circle size={11} className="text-emerald-400 fill-current" />
              </div>
              <span className="text-[10px] text-slate-500 font-mono ml-2 flex-1 truncate">
                /bin/bash — {toolId || stepName}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                followTail
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-700/50 text-slate-500'
              }`}>
                {followTail ? 'FOLLOWING' : 'PAUSED'}
              </span>
            </div>

            <div className="relative">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`bg-[#0b1020]/95 font-mono text-xs overflow-y-auto p-3 transition-all duration-300 ${
                  isExpanded ? 'max-h-[60vh]' : 'max-h-80'
                }`}
                style={{
                  scrollBehavior: followTail ? 'smooth' : 'auto',
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
                  backgroundSize: '100% 20px',
                }}
              >
                {filteredLines.length === 0 ? (
                  <div className="text-slate-600 text-center py-10">
                    {keyword || levelFilter !== 'ALL'
                      ? '—— 没有匹配的日志行 ——'
                      : '$ 等待日志输出...'}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredLines.map((line, idx) => {
                      const style = LEVEL_STYLES[line.level] || LEVEL_STYLES.INFO;
                      return (
                        <div
                          key={`${stepId}-${idx}`}
                          className="flex items-start gap-2 hover:bg-white/5 px-1 py-0.5 rounded leading-relaxed group"
                        >
                          <span className="text-slate-600 flex-shrink-0 select-none whitespace-nowrap w-[68px] tabular-nums">
                            {line.timestamp.substring(11)}
                          </span>
                          <span className={`flex items-center justify-center px-1.5 py-px rounded text-[10px] font-bold flex-shrink-0 w-[52px] ${style.bg} ${style.text} border border-current/20`}>
                            {style.label}
                          </span>
                          <span className={`flex-1 min-w-0 break-all ${style.text}`}>
                            {highlightMatch(line.message, keyword)}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(line.message);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-slate-400 transition-opacity flex-shrink-0 p-0.5 -m-0.5"
                            title="复制此行"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {showScrollButton && !followTail && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-3 right-3 bg-slate-800/95 hover:bg-primary-600 border border-slate-600 hover:border-primary-500 text-slate-300 hover:text-white rounded-full p-2 shadow-lg shadow-black/40 transition-all group"
                  title="滚动到最新日志"
                >
                  <ArrowDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-600 font-mono">
            <span>step: {stepId}</span>
            <span>
              {filteredLines.length === logLines.length
                ? `显示全部 ${logLines.length} 行`
                : `显示 ${filteredLines.length}/${logLines.length} 行`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
