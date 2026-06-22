import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, X, Terminal, Copy, Check, Trash2 } from 'lucide-react';
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(logLines.length);

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

  useEffect(() => {
    if (!collapsed && followTail && logLines.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevCountRef.current = logLines.length;
  }, [logLines, collapsed, followTail]);

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
                title="清空筛选"
              >
                <Trash2 size={14} />
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

          <div
            ref={scrollRef}
            className="bg-black/60 font-mono text-xs overflow-y-auto p-3 max-h-80"
            style={{
              scrollBehavior: followTail ? 'smooth' : 'auto',
            }}
          >
            {filteredLines.length === 0 ? (
              <div className="text-slate-600 text-center py-8">
                {keyword || levelFilter !== 'ALL'
                  ? '没有匹配的日志行'
                  : '暂无日志输出'}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredLines.map((line, idx) => {
                  const style = LEVEL_STYLES[line.level] || LEVEL_STYLES.INFO;
                  return (
                    <div
                      key={`${stepId}-${idx}`}
                      className="flex items-start gap-2 hover:bg-slate-800/30 px-1 py-0.5 rounded leading-relaxed"
                    >
                      <span className="text-slate-600 flex-shrink-0 select-none whitespace-nowrap">
                        {line.timestamp.substring(11)}
                      </span>
                      <span className={`flex items-center justify-center px-1 py-px rounded text-[10px] font-bold flex-shrink-0 w-10 ${style.bg} ${style.text} border border-current/20`}>
                        {style.label}
                      </span>
                      <span className={`flex-1 min-w-0 break-all ${style.text}`}>
                        {highlightMatch(line.message, keyword)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
