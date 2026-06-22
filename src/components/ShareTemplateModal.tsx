import { useState } from 'react';
import { X, Copy, Check, Clock, Shield, Link, AlertCircle } from 'lucide-react';
import type { WorkflowTemplate, ShareLink } from '@shared/types';

interface ShareTemplateModalProps {
  template: WorkflowTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: (templateId: string, permissions: 'view' | 'view_copy', expiresInDays?: number) => Promise<ShareLink & { shareUrl: string }>;
}

export default function ShareTemplateModal({
  template,
  isOpen,
  onClose,
  onShare,
}: ShareTemplateModalProps) {
  const [permissions, setPermissions] = useState<'view' | 'view_copy'>('view');
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
  const [shareResult, setShareResult] = useState<(ShareLink & { shareUrl: string }) | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !template) return null;

  const handleShare = async () => {
    setLoading(true);
    try {
      const result = await onShare(template.id, permissions, expiresInDays);
      setShareResult(result);
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareResult?.shareUrl) {
      await navigator.clipboard.writeText(shareResult.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setShareResult(null);
    setPermissions('view');
    setExpiresInDays(undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">分享模板</h2>
            <p className="text-sm text-slate-400 mt-1">{template.name}</p>
          </div>
          <button
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            onClick={() => {
              onClose();
              handleReset();
            }}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {!shareResult ? (
            <>
              <div>
                <label className="block text-sm text-slate-400 mb-3 flex items-center gap-2">
                  <Shield size={14} />
                  权限设置
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      permissions === 'view'
                        ? 'bg-primary-500/10 border border-primary-500/30'
                        : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="permission"
                      value="view"
                      checked={permissions === 'view'}
                      onChange={() => setPermissions('view')}
                      className="w-4 h-4 text-primary-500"
                    />
                    <div>
                      <p className="text-white font-medium">仅查看</p>
                      <p className="text-xs text-slate-500">接收者可以查看模板详情，但不能复制到自己的模板库</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      permissions === 'view_copy'
                        ? 'bg-primary-500/10 border border-primary-500/30'
                        : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="permission"
                      value="view_copy"
                      checked={permissions === 'view_copy'}
                      onChange={() => setPermissions('view_copy')}
                      className="w-4 h-4 text-primary-500"
                    />
                    <div>
                      <p className="text-white font-medium">查看并复制</p>
                      <p className="text-xs text-slate-500">接收者可以查看模板并复制到自己的模板库中使用</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-3 flex items-center gap-2">
                  <Clock size={14} />
                  有效期
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '7天', value: 7 },
                    { label: '30天', value: 30 },
                    { label: '90天', value: 90 },
                    { label: '永久', value: undefined },
                  ].map((option) => (
                    <button
                      key={option.label}
                      className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                        expiresInDays === option.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                      onClick={() => setExpiresInDays(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
                <AlertCircle className="text-blue-400 mt-0.5 flex-shrink-0" size={18} />
                <div className="text-sm">
                  <p className="text-blue-300 font-medium mb-1">分享说明</p>
                  <p className="text-blue-400/80">
                    分享链接仅用于模板查看和使用，不会泄露您的个人数据或分析结果。
                  </p>
                </div>
              </div>

              <button
                className="w-full btn-primary flex items-center justify-center gap-2"
                onClick={handleShare}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    生成链接中...
                  </>
                ) : (
                  <>
                    <Link size={16} />
                    生成分享链接
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="space-y-5">
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">分享链接已生成</h3>
                <p className="text-sm text-slate-400">
                  {expiresInDays
                    ? `链接将在 ${expiresInDays} 天后过期`
                    : '链接永久有效'}
                </p>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-xl">
                <p className="text-xs text-slate-500 mb-2">分享链接</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareResult.shareUrl}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono truncate"
                  />
                  <button
                    className="p-2.5 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                    onClick={handleCopyLink}
                  >
                    {copied ? <Check size={16} className="text-white" /> : <Copy size={16} className="text-white" />}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-400 mt-2">链接已复制到剪贴板</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <p className="text-slate-500 mb-1">分享码</p>
                  <p className="text-white font-mono">{shareResult.shareCode}</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl">
                  <p className="text-slate-500 mb-1">权限</p>
                  <p className="text-white">{permissions === 'view' ? '仅查看' : '查看并复制'}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 btn-secondary"
                  onClick={handleReset}
                >
                  重新生成
                </button>
                <button
                  className="flex-1 btn-primary"
                  onClick={() => {
                    onClose();
                    handleReset();
                  }}
                >
                  完成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
