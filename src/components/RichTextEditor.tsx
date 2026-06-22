import { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3,
  Link, Unlink, Quote, Undo, Redo, Type, Highlighter
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleInput();
  };

  const handleAddLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
    }
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: '加粗' },
    { icon: Italic, command: 'italic', title: '斜体' },
    { icon: Underline, command: 'underline', title: '下划线' },
    { icon: Strikethrough, command: 'strikeThrough', title: '删除线' },
    { type: 'divider' },
    { icon: Heading1, command: 'formatBlock', arg: '<h1>', title: '一级标题' },
    { icon: Heading2, command: 'formatBlock', arg: '<h2>', title: '二级标题' },
    { icon: Heading3, command: 'formatBlock', arg: '<h3>', title: '三级标题' },
    { icon: Type, command: 'formatBlock', arg: '<p>', title: '正文' },
    { type: 'divider' },
    { icon: List, command: 'insertUnorderedList', title: '无序列表' },
    { icon: ListOrdered, command: 'insertOrderedList', title: '有序列表' },
    { icon: Quote, command: 'formatBlock', arg: '<blockquote>', title: '引用' },
    { type: 'divider' },
    { icon: AlignLeft, command: 'justifyLeft', title: '左对齐' },
    { icon: AlignCenter, command: 'justifyCenter', title: '居中对齐' },
    { icon: AlignRight, command: 'justifyRight', title: '右对齐' },
    { type: 'divider' },
    { icon: Undo, command: 'undo', title: '撤销' },
    { icon: Redo, command: 'redo', title: '重做' },
    { type: 'divider' },
    {
      icon: Link, title: '插入链接', action: () => {
        setShowLinkModal(true);
        editorRef.current?.focus();
      }
    },
    { icon: Unlink, command: 'unlink', title: '移除链接' },
    { type: 'color' },
  ];

  return (
    <div className="border border-slate-600 rounded-xl overflow-hidden bg-slate-900/50">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-700 bg-slate-800/50">
        {toolbarButtons.map((btn, idx) => {
          if (btn.type === 'divider') {
            return <div key={idx} className="w-px h-5 bg-slate-600 mx-1" />;
          }
          if (btn.type === 'color') {
            return (
              <div key={idx} className="flex items-center gap-1 ml-1">
                <label className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-700 rounded-lg cursor-pointer" title="文字颜色">
                  <Type size={16} className="text-slate-400" />
                  <input
                    type="color"
                    className="w-5 h-5 bg-transparent cursor-pointer border-0 p-0"
                    onChange={(e) => execCommand('foreColor', e.target.value)}
                    defaultValue="#ffffff"
                  />
                </label>
                <label className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-700 rounded-lg cursor-pointer" title="高亮颜色">
                  <Highlighter size={16} className="text-slate-400" />
                  <input
                    type="color"
                    className="w-5 h-5 bg-transparent cursor-pointer border-0 p-0"
                    onChange={(e) => execCommand('hiliteColor', e.target.value)}
                    defaultValue="#fbbf24"
                  />
                </label>
              </div>
            );
          }
          const Icon = btn.icon!;
          const action = btn.action || (() => execCommand(btn.command!, btn.arg));
          return (
            <button
              key={idx}
              type="button"
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
              onClick={action}
              title={btn.title}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
      <div
        ref={editorRef}
        className="min-h-[200px] max-h-[500px] overflow-y-auto p-4 text-slate-200 focus:outline-none prose prose-invert max-w-none
          prose-headings:text-white prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-strong:text-white prose-em:text-slate-300
          prose-ul:text-slate-300 prose-ol:text-slate-300 prose-li:marker:text-primary-400
          prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:bg-slate-800/50 prose-blockquote:text-slate-300 prose-blockquote:italic prose-blockquote:rounded-r-lg
          prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
          empty:before:content-[attr(data-placeholder)] empty:before:text-slate-500"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder || '开始输入内容...'}
      />
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">插入链接</h3>
            <input
              type="url"
              className="input-field w-full mb-4"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => { setShowLinkModal(false); setLinkUrl(''); }}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleAddLink}
                disabled={!linkUrl}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
