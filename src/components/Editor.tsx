import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import { useEffect, useRef, useState } from 'react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { 
  Bold, Italic, List, ListOrdered, Table as TableIcon, 
  Image as ImageIcon, Link as LinkIcon, CheckSquare, 
  Heading1, Heading2, Quote, Undo, Redo,
  TableCellsSplit, TableRowsSplit, Columns, Rows,
  Underline as UnderlineIcon, Strikethrough, Smile, Plus,
  ChevronDown, Type, Trash2, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, MoreHorizontal
} from 'lucide-react';
import TextAlign from '@tiptap/extension-text-align';
import { cn } from '../lib/utils';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

const MenuButton = ({ 
  onClick, 
  active, 
  disabled, 
  children,
  title
}: { 
  onClick: () => void; 
  active?: boolean; 
  disabled?: boolean; 
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "p-2.5 sm:p-2 rounded-md transition-colors",
      active ? "bg-zinc-200 text-zinc-900" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
      disabled && "opacity-50 cursor-not-allowed"
    )}
    style={active ? { backgroundColor: 'var(--accent-color)', color: 'white' } : { color: 'var(--text-secondary)' }}
  >
    {children}
  </button>
);

export default function Editor({ content, onChange, editable = true }: EditorProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (menuName: string) => {
    setActiveMenu(prev => prev === menuName ? null : menuName);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Strike,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));

        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              view.dispatch(view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({ src })
              ));
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const items = Array.from(event.dataTransfer?.files || []);
        const imageFile = items.find(file => file.type.startsWith('image/'));

        if (imageFile) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            view.dispatch(view.state.tr.replaceSelectionWith(
              view.state.schema.nodes.image.create({ src })
            ));
          };
          reader.readAsDataURL(imageFile);
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  const currentTheme = document.documentElement.getAttribute('data-theme');
  const emojiTheme = currentTheme === 'dark' || currentTheme === 'dark-blue' ? EmojiTheme.DARK : EmojiTheme.LIGHT;

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden shadow-sm" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--editor-bg)' }}>
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 sm:gap-1 p-1 sm:p-2 border-b shrink-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
          {/* Main Formatting */}
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold size={16} className="sm:w-[18px] sm:h-[18px]" />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic size={16} className="sm:w-[18px] sm:h-[18px]" />
          </MenuButton>
          
          {/* Text Styles Dropdown */}
          <div className="relative">
            <MenuButton 
              onClick={() => toggleMenu('format')}
              active={editor.isActive('underline') || editor.isActive('strike') || editor.isActive('heading')}
              title="Text Styles"
            >
              <div className="flex items-center gap-0.5">
                <Type size={16} className="sm:w-[18px] sm:h-[18px]" />
                <ChevronDown size={10} />
              </div>
            </MenuButton>
            {activeMenu === 'format' && (
              <div 
                className="absolute top-full left-0 mt-1 z-50 border rounded-lg shadow-xl p-1 flex flex-col min-w-[140px]"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => { editor.chain().focus().toggleUnderline().run(); setActiveMenu(null); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors",
                    editor.isActive('underline') ? "bg-zinc-100" : "hover:bg-zinc-50"
                  )}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <UnderlineIcon size={14} /> Underline
                </button>
                <button
                  onClick={() => { editor.chain().focus().toggleStrike().run(); setActiveMenu(null); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors",
                    editor.isActive('strike') ? "bg-zinc-100" : "hover:bg-zinc-50"
                  )}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Strikethrough size={14} /> Strikethrough
                </button>
                <div className="h-px my-1" style={{ backgroundColor: 'var(--border-color)' }} />
                <button
                  onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setActiveMenu(null); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors",
                    editor.isActive('heading', { level: 1 }) ? "bg-zinc-100" : "hover:bg-zinc-50"
                  )}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Heading1 size={14} /> Heading 1
                </button>
                <button
                  onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setActiveMenu(null); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors",
                    editor.isActive('heading', { level: 2 }) ? "bg-zinc-100" : "hover:bg-zinc-50"
                  )}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Heading2 size={14} /> Heading 2
                </button>
                <button
                  onClick={() => { editor.chain().focus().toggleBlockquote().run(); setActiveMenu(null); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors",
                    editor.isActive('blockquote') ? "bg-zinc-100" : "hover:bg-zinc-50"
                  )}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Quote size={14} /> Quote
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 mx-0.5 sm:mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

          {/* Alignment Dropdown */}
          <div className="relative">
            <MenuButton 
              onClick={() => toggleMenu('align')}
              title="Alignment"
            >
              <div className="flex items-center gap-0.5">
                {editor.isActive({ textAlign: 'center' }) ? <AlignCenter size={16} className="sm:w-[18px] sm:h-[18px]" /> :
                 editor.isActive({ textAlign: 'right' }) ? <AlignRight size={16} className="sm:w-[18px] sm:h-[18px]" /> :
                 editor.isActive({ textAlign: 'justify' }) ? <AlignJustify size={16} className="sm:w-[18px] sm:h-[18px]" /> :
                 <AlignLeft size={16} className="sm:w-[18px] sm:h-[18px]" />}
                <ChevronDown size={10} />
              </div>
            </MenuButton>
            {activeMenu === 'align' && (
              <div 
                className="absolute top-full left-0 mt-1 z-50 border rounded-lg shadow-xl p-1 flex flex-col min-w-[140px]"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => { editor.chain().focus().setTextAlign('left').run(); setActiveMenu(null); }}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-zinc-50 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <AlignLeft size={14} /> Left
                </button>
                <button
                  onClick={() => { editor.chain().focus().setTextAlign('center').run(); setActiveMenu(null); }}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-zinc-50 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <AlignCenter size={14} /> Center
                </button>
                <button
                  onClick={() => { editor.chain().focus().setTextAlign('right').run(); setActiveMenu(null); }}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-zinc-50 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <AlignRight size={14} /> Right
                </button>
                <button
                  onClick={() => { editor.chain().focus().setTextAlign('justify').run(); setActiveMenu(null); }}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-zinc-50 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <AlignJustify size={14} /> Justify
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 mx-0.5 sm:mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

          {/* Lists Dropdown */}
          <div className="relative">
            <MenuButton 
              onClick={() => toggleMenu('list')}
              active={editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')}
              title="Lists"
            >
              <div className="flex items-center gap-0.5">
                <List size={16} className="sm:w-[18px] sm:h-[18px]" />
                <ChevronDown size={10} />
              </div>
            </MenuButton>
            {activeMenu === 'list' && (
              <div 
                className="absolute top-full left-0 mt-1 z-50 border rounded-lg shadow-xl p-1 flex flex-col min-w-[140px]"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => { editor.chain().focus().toggleBulletList().run(); setActiveMenu(null); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors",
                    editor.isActive('bulletList') ? "bg-zinc-100" : "hover:bg-zinc-50"
                  )}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <List size={14} /> Bullet List
                </button>
                <button
                  onClick={() => { editor.chain().focus().toggleOrderedList().run(); setActiveMenu(null); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors",
                    editor.isActive('orderedList') ? "bg-zinc-100" : "hover:bg-zinc-50"
                  )}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <ListOrdered size={14} /> Ordered List
                </button>
                <button
                  onClick={() => { editor.chain().focus().toggleTaskList().run(); setActiveMenu(null); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors",
                    editor.isActive('taskList') ? "bg-zinc-100" : "hover:bg-zinc-50"
                  )}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <CheckSquare size={14} /> Task List
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 mx-0.5 sm:mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

          {/* Insert Dropdown */}
          <div className="relative" ref={emojiRef}>
            <MenuButton 
              onClick={() => toggleMenu('insert')}
              title="Insert"
            >
              <div className="flex items-center gap-0.5">
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                <ChevronDown size={10} />
              </div>
            </MenuButton>
            {activeMenu === 'insert' && (
              <div 
                className="absolute top-full left-0 mt-1 z-50 border rounded-lg shadow-xl p-1 flex flex-col min-w-[160px]"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => {
                    const url = window.prompt('URL');
                    if (url) editor.chain().focus().setLink({ href: url }).run();
                    setActiveMenu(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors",
                    editor.isActive('link') ? "bg-zinc-100" : "hover:bg-zinc-50"
                  )}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <LinkIcon size={14} /> Add Link
                </button>
                <button
                  onClick={() => {
                    const url = window.prompt('Image URL');
                    if (url) {
                      editor.chain().focus().setImage({ src: url }).run();
                    } else {
                      fileInputRef.current?.click();
                    }
                    setActiveMenu(null);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-zinc-50 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <ImageIcon size={14} /> Add Image
                </button>
                <button
                  onClick={() => { toggleMenu('emoji'); }}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-zinc-50 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Smile size={14} /> Emoji
                </button>
              </div>
            )}
            {activeMenu === 'emoji' && (
              <div className="absolute top-full left-0 mt-1 z-[100] shadow-2xl">
                <EmojiPicker 
                  theme={emojiTheme}
                  onEmojiClick={(emojiData) => {
                    editor.chain().focus().insertContent(emojiData.emoji).run();
                    setActiveMenu(null);
                  }}
                />
              </div>
            )}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />

          <div className="w-px h-6 mx-0.5 sm:mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

          {/* Table Menu */}
          <div className="relative">
            <MenuButton 
              onClick={() => toggleMenu('table')}
              active={editor.isActive('table')}
              title="Table Operations"
            >
              <div className="flex items-center gap-0.5">
                <TableIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                <ChevronDown size={10} />
              </div>
            </MenuButton>
            {activeMenu === 'table' && (
              <div 
                className="absolute top-full left-0 mt-1 z-50 border rounded-lg shadow-xl p-1 flex flex-col min-w-[160px]"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run(); setActiveMenu(null); }}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <TableIcon size={14} /> Insert Table (3x2)
                </button>
                {editor.isActive('table') && (
                  <>
                    <div className="h-px my-1" style={{ backgroundColor: 'var(--border-color)' }} />
                    <button
                      onClick={() => { editor.chain().focus().addColumnAfter().run(); setActiveMenu(null); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Columns size={14} /> Add Column
                    </button>
                    <button
                      onClick={() => { editor.chain().focus().addRowAfter().run(); setActiveMenu(null); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Rows size={14} /> Add Row
                    </button>
                    <button
                      onClick={() => { editor.chain().focus().deleteColumn().run(); setActiveMenu(null); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors text-red-500"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <TableCellsSplit size={14} /> Delete Column
                    </button>
                    <button
                      onClick={() => { editor.chain().focus().deleteRow().run(); setActiveMenu(null); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors text-red-500"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <TableRowsSplit size={14} /> Delete Row
                    </button>
                    <button
                      onClick={() => { editor.chain().focus().deleteTable().run(); setActiveMenu(null); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors text-red-600 font-medium"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 size={14} /> Delete Table
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="w-px h-6 mx-0.5 sm:mx-1" style={{ backgroundColor: 'var(--border-color)' }} />
          
          <MenuButton 
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo size={16} className="sm:w-[18px] sm:h-[18px]" />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo size={16} className="sm:w-[18px] sm:h-[18px]" />
          </MenuButton>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 focus:outline-none" style={{ backgroundColor: 'var(--editor-bg)', color: 'var(--text-primary)' }}>
        <EditorContent editor={editor} className="max-w-3xl mx-auto" />
      </div>
    </div>
  );
}
