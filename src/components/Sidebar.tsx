import { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Folder, FileText, ChevronRight, ChevronDown, 
  Plus, MoreVertical, Trash2, Edit2, Search,
  FolderPlus, FilePlus, ArrowUp, ArrowDown, Palette,
  Circle, X, Settings as SettingsIcon, History
} from 'lucide-react';
import { Node as AppNode } from '../types';
import { cn } from '../lib/utils';

const COLORS = [
  { name: 'Default', value: '' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Teal', value: '#14b8a6' },
];

const ALL_ICONS = (() => {
  try {
    const icons = LucideIcons as any;
    // Try to find the icons object in various common export patterns
    const source = icons.icons || (icons.default && typeof icons.default === 'object' ? icons.default : icons);
    
    const iconNames = Object.keys(source).filter(name => 
      /^[A-Z]/.test(name) && 
      !['LucideIcon', 'createLucideIcon', 'LucideProps', 'Lucide', 'icons', 'default'].includes(name)
    );
    
    const result = iconNames.map(name => ({
      name,
      icon: source[name]
    })).filter(item => 
      item.icon && (typeof item.icon === 'function' || typeof item.icon === 'object')
    );

    if (result.length > 0) {
      return result.sort((a, b) => a.name.localeCompare(b.name));
    }
  } catch (e) {
    console.error("Error loading icons:", e);
  }

  // Fallback to a small set of guaranteed icons if detection fails
  return [
    { name: 'StickyNote', icon: LucideIcons.StickyNote },
    { name: 'Folder', icon: LucideIcons.Folder },
    { name: 'FileText', icon: LucideIcons.FileText },
    { name: 'Star', icon: LucideIcons.Star },
    { name: 'Heart', icon: LucideIcons.Heart },
    { name: 'Home', icon: LucideIcons.Home },
    { name: 'Settings', icon: LucideIcons.Settings },
    { name: 'Search', icon: LucideIcons.Search },
    { name: 'Bell', icon: LucideIcons.Bell },
    { name: 'Bookmark', icon: LucideIcons.Bookmark },
    { name: 'Calendar', icon: LucideIcons.Calendar },
    { name: 'Clock', icon: LucideIcons.Clock },
    { name: 'Cloud', icon: LucideIcons.Cloud },
    { name: 'Code', icon: LucideIcons.Code },
    { name: 'Database', icon: LucideIcons.Database },
    { name: 'Flag', icon: LucideIcons.Flag },
    { name: 'Gift', icon: LucideIcons.Gift },
    { name: 'Globe', icon: LucideIcons.Globe },
    { name: 'Image', icon: LucideIcons.Image },
    { name: 'Inbox', icon: LucideIcons.Inbox },
    { name: 'Key', icon: LucideIcons.Key },
    { name: 'Link', icon: LucideIcons.Link },
    { name: 'Lock', icon: LucideIcons.Lock },
    { name: 'Mail', icon: LucideIcons.Mail },
    { name: 'Map', icon: LucideIcons.Map },
    { name: 'Mic', icon: LucideIcons.Mic },
    { name: 'Moon', icon: LucideIcons.Moon },
    { name: 'Music', icon: LucideIcons.Music },
    { name: 'Package', icon: LucideIcons.Package },
    { name: 'Phone', icon: LucideIcons.Phone },
    { name: 'Play', icon: LucideIcons.Play },
    { name: 'Save', icon: LucideIcons.Save },
    { name: 'Send', icon: LucideIcons.Send },
    { name: 'Shield', icon: LucideIcons.Shield },
    { name: 'Sun', icon: LucideIcons.Sun },
    { name: 'Tag', icon: LucideIcons.Tag },
    { name: 'Target', icon: LucideIcons.Target },
    { name: 'Terminal', icon: LucideIcons.Terminal },
    { name: 'Trash', icon: LucideIcons.Trash2 },
    { name: 'User', icon: LucideIcons.User },
    { name: 'Zap', icon: LucideIcons.Zap }
  ].filter(i => i.icon);
})();

const AppearanceModal = ({ 
  node, 
  onUpdateColor, 
  onUpdateIcon, 
  onClose 
}: { 
  node: AppNode; 
  onUpdateColor: (id: string, color: string) => void;
  onUpdateIcon: (id: string, icon: string) => void;
  onClose: () => void;
}) => {
  const [search, setSearch] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as globalThis.Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredIcons = useMemo(() => {
    const query = search.toLowerCase();
    return (ALL_ICONS || []).filter(i => i.name.toLowerCase().includes(query));
  }, [search]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        ref={modalRef}
        className="rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden border"
        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Appearance: {node.name}</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full transition-colors" 
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Color Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Color</label>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map(c => (
                <button
                  key={c.name}
                  onClick={() => onUpdateColor(node.id, c.value)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all hover:scale-110",
                    node.color === c.value ? "scale-110" : "border-transparent"
                  )}
                  style={{ 
                    backgroundColor: c.value || '#a1a1aa',
                    borderColor: node.color === c.value ? 'var(--accent-color)' : 'transparent'
                  }}
                  title={c.name}
                />
              ))}
              <div className="relative w-5 h-5 group">
                <input 
                  type="color"
                  value={node.color || '#000000'}
                  onChange={(e) => onUpdateColor(node.id, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title="Custom Color"
                />
                <div 
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center bg-gradient-to-tr from-red-500 via-green-500 to-blue-500"
                  style={{ 
                    borderColor: COLORS.some(c => c.value === node.color) ? 'transparent' : (node.color ? 'var(--accent-color)' : 'var(--border-color)'),
                    transform: COLORS.some(c => c.value === node.color) ? 'none' : (node.color ? 'scale(1.1)' : 'none')
                  }}
                >
                  <Palette size={8} className="text-white drop-shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Icon</label>
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2" size={12} style={{ color: 'var(--text-secondary)' }} />
                <input 
                  type="text"
                  placeholder="Search icons..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs rounded border outline-none transition-all"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-8 gap-1.5 p-1 max-h-64 overflow-y-auto border rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => onUpdateIcon(node.id, '')}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-md border transition-all",
                  !node.icon ? "border-zinc-900" : "border-transparent"
                )}
                style={{ 
                  borderColor: !node.icon ? 'var(--accent-color)' : 'transparent',
                  backgroundColor: !node.icon ? 'var(--hover-bg)' : 'transparent'
                }}
                onMouseEnter={(e) => { if (!node.icon) return; e.currentTarget.style.backgroundColor = 'var(--hover-bg)' }}
                onMouseLeave={(e) => { if (!node.icon) return; e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span className="text-[8px]" style={{ color: 'var(--text-secondary)' }}>None</span>
              </button>
              {filteredIcons.length === 0 && (
                <div className="col-span-8 py-8 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                  No icons found
                </div>
              )}
              {filteredIcons.map(i => {
                const IconComp = i.icon;
                const isActive = node.icon === i.name;
                return (
                  <button
                    key={i.name}
                    onClick={() => onUpdateIcon(node.id, i.name)}
                    className={cn(
                      "aspect-square flex items-center justify-center rounded-md border transition-all",
                      isActive ? "border-zinc-900" : "border-transparent"
                    )}
                    style={{ 
                      borderColor: isActive ? 'var(--accent-color)' : 'transparent',
                      backgroundColor: isActive ? 'var(--hover-bg)' : 'transparent'
                    }}
                    onMouseEnter={(e) => { if (isActive) return; e.currentTarget.style.backgroundColor = 'var(--hover-bg)' }}
                    onMouseLeave={(e) => { if (isActive) return; e.currentTarget.style.backgroundColor = 'transparent' }}
                    title={i.name}
                  >
                    <IconComp size={16} style={{ color: node.color || 'var(--text-primary)' }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--border-color)' }}>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
            style={{ backgroundColor: 'var(--accent-color)', color: 'var(--bg-main)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  nodes: AppNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onCreateNode: (parentId: string | null, type: 'folder' | 'note') => void;
  onDeleteNode: (nodeId: string) => void;
  onRenameNode: (nodeId: string, newName: string) => void;
  onRelocateNode: (nodeId: string, newParentId: string | null) => void;
  onReorderNode: (nodeId: string, direction: 'up' | 'down') => void;
  onUpdateColor: (nodeId: string, color: string) => void;
  onUpdateIcon: (nodeId: string, icon: string) => void;
  newlyCreatedNodeId: string | null;
  onClearNewlyCreated: () => void;
  isOpen: boolean;
  onOpenSettings: () => void;
  appName: string;
  isRecentOpen: boolean;
  setIsRecentOpen: (open: boolean) => void;
}

const TreeItem = ({ 
  node, 
  level, 
  nodes, 
  selectedNodeId, 
  onSelectNode, 
  onCreateNode, 
  onDeleteNode, 
  onRenameNode,
  onRelocateNode,
  onReorderNode,
  onUpdateColor,
  onUpdateIcon,
  newlyCreatedNodeId,
  onClearNewlyCreated
}: { 
  node: AppNode; 
  level: number; 
  nodes: AppNode[]; 
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onCreateNode: (parentId: string | null, type: 'folder' | 'note') => void;
  onDeleteNode: (nodeId: string) => void;
  onRenameNode: (nodeId: string, newName: string) => void;
  onRelocateNode: (nodeId: string, newParentId: string | null) => void;
  onReorderNode: (nodeId: string, direction: 'up' | 'down') => void;
  onUpdateColor: (nodeId: string, color: string) => void;
  onUpdateIcon: (nodeId: string, icon: string) => void;
  newlyCreatedNodeId: string | null;
  onClearNewlyCreated: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (selectedNodeId) {
      const isDescendant = (parentId: string, targetId: string): boolean => {
        const targetNode = nodes.find(n => n.id === targetId);
        if (!targetNode) return false;
        if (targetNode.parentId === parentId) return true;
        if (targetNode.parentId) return isDescendant(parentId, targetNode.parentId);
        return false;
      };
      
      if (isDescendant(node.id, selectedNodeId)) {
        setIsOpen(true);
      }
    }
  }, [selectedNodeId, node.id, nodes]);

  useEffect(() => {
    if (newlyCreatedNodeId === node.id) {
      setIsEditing(true);
      onClearNewlyCreated();
    }
  }, [newlyCreatedNodeId, node.id, onClearNewlyCreated]);

  const children = useMemo(() => 
    nodes.filter(n => n.parentId === node.id)
      .sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
      }), 
    [nodes, node.id]
  );

  const handleRename = () => {
    if (newName.trim() && newName !== node.name) {
      onRenameNode(node.id, newName);
    }
    setIsEditing(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('nodeId', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (node.type === 'folder') {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedNodeId = e.dataTransfer.getData('nodeId');
    if (draggedNodeId && draggedNodeId !== node.id) {
      // If dropping onto a folder, move inside. If onto a note, move to same parent.
      const newParentId = node.type === 'folder' ? node.id : node.parentId;
      onRelocateNode(draggedNodeId, newParentId);
      if (node.type === 'folder') setIsOpen(true);
    }
  };

  return (
    <div className="select-none">
      {showAppearanceModal && (
        <AppearanceModal 
          node={node} 
          onUpdateColor={onUpdateColor} 
          onUpdateIcon={onUpdateIcon} 
          onClose={() => setShowAppearanceModal(false)} 
        />
      )}
      <div 
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group flex items-center py-1 px-2 rounded-md cursor-pointer transition-all",
          isDragOver && "bg-blue-500/10 ring-2 ring-blue-500/30"
        )}
        style={{ 
          paddingLeft: `${level * 12 + 8}px`,
          backgroundColor: selectedNodeId === node.id ? 'var(--hover-bg)' : undefined,
          color: selectedNodeId === node.id ? 'var(--text-primary)' : 'var(--text-secondary)'
        }}
        onClick={() => {
          onSelectNode(node.id);
        }}
      >
        <button 
          className="mr-1 w-4 h-4 flex items-center justify-center hover:bg-zinc-200/20 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (node.type === 'folder') setIsOpen(!isOpen);
          }}
        >
          {node.type === 'folder' && (
            children.length > 0 ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null
          )}
        </button>
        <span className="mr-2" style={{ color: node.color || undefined }}>
          {node.icon ? (
            (() => {
              const IconComp = (LucideIcons as any)[node.icon] || Circle;
              return <IconComp size={16} fill={node.color ? `${node.color}20` : 'transparent'} />;
            })()
          ) : (
            node.type === 'folder' ? (
              <Folder size={16} fill={node.color ? `${node.color}20` : 'transparent'} />
            ) : (
              <FileText size={16} fill={node.color ? `${node.color}10` : 'transparent'} />
            )
          )}
        </span>
        
        {isEditing ? (
          <input
            autoFocus
            className="flex-1 border rounded px-1 text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-sm">{node.name}</span>
        )}

        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          {node.type === 'folder' && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onCreateNode(node.id, 'folder'); setIsOpen(true); }}
                className="p-1 hover:bg-zinc-200 rounded hidden sm:block"
                title="New Folder"
              >
                <FolderPlus size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onCreateNode(node.id, 'note'); setIsOpen(true); }}
                className="p-1 hover:bg-zinc-200 rounded hidden sm:block"
                title="New Note"
              >
                <FilePlus size={14} />
              </button>
            </>
          )}
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 hover:bg-zinc-200 rounded"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div 
                className="absolute right-0 mt-1 w-40 border rounded-md shadow-lg z-50 py-1"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                onMouseLeave={() => { setShowMenu(false); }}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Edit2 size={12} /> Rename
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowAppearanceModal(true); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Palette size={12} /> Appearance
                </button>

                <div className="h-px my-1" style={{ backgroundColor: 'var(--border-color)' }} />
                <button 
                  onClick={(e) => { e.stopPropagation(); onReorderNode(node.id, 'up'); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <ArrowUp size={12} /> Move Up
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onReorderNode(node.id, 'down'); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <ArrowDown size={12} /> Move Down
                </button>
                <div className="h-px my-1" style={{ backgroundColor: 'var(--border-color)' }} />
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-600 flex items-center gap-2 transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isOpen && node.type === 'folder' && (
        <div className="mt-0.5">
          {(children || []).map(child => (
            <TreeItem 
              key={child.id} 
              node={child} 
              level={level + 1} 
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onCreateNode={onCreateNode}
              onDeleteNode={onDeleteNode}
              onRenameNode={onRenameNode}
              onRelocateNode={onRelocateNode}
              onReorderNode={onReorderNode}
              onUpdateColor={onUpdateColor}
              onUpdateIcon={onUpdateIcon}
              newlyCreatedNodeId={newlyCreatedNodeId}
              onClearNewlyCreated={onClearNewlyCreated}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Sidebar({ 
  nodes, 
  selectedNodeId, 
  onSelectNode, 
  onCreateNode, 
  onDeleteNode, 
  onRenameNode,
  onRelocateNode,
  onReorderNode,
  onUpdateColor,
  onUpdateIcon,
  newlyCreatedNodeId,
  onClearNewlyCreated,
  isOpen,
  onOpenSettings,
  appName,
  isRecentOpen,
  setIsRecentOpen
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const rootNodes = useMemo(() => 
    nodes.filter(n => n.parentId === null)
      .sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
      }), 
    [nodes]
  );

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(n => 
      n.name.toLowerCase().includes(query) || 
      n.content.toLowerCase().includes(query)
    );
  }, [nodes, searchQuery]);

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-72 h-full flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )} style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', borderRightWidth: '1px' }}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="italic text-xl" style={{ color: 'var(--text-primary)' }}>{appName}</h1>
          <div className="flex gap-1">
            <button 
              onClick={() => setIsRecentOpen(!isRecentOpen)}
              className="p-1.5 hover:bg-zinc-200 rounded-md transition-colors relative"
              style={{ color: 'var(--text-secondary)' }}
              title="Recent Notes"
            >
              <History size={18} className={cn(isRecentOpen && "text-zinc-900")} />
            </button>
            <button 
              onClick={onOpenSettings}
              className="p-1.5 hover:bg-zinc-200 rounded-md transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="App Settings"
            >
              <SettingsIcon size={18} />
            </button>
            <button 
              onClick={() => onCreateNode(null, 'folder')}
              className="p-1.5 hover:bg-zinc-200 rounded-md transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="New Root Folder"
            >
              <FolderPlus size={18} />
            </button>
            <button 
              onClick={() => onCreateNode(null, 'note')}
              className="p-1.5 hover:bg-zinc-200 rounded-md transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="New Root Note"
            >
              <FilePlus size={18} />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-secondary)' }} />
          <input 
            type="text"
            placeholder="Search notes..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all"
            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderWidth: '1px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {searchQuery.trim() ? (
          <div className="space-y-1">
            {(filteredNodes || []).length > 0 ? (
              (filteredNodes || []).map(node => (
                <div 
                  key={node.id}
                  className={cn(
                    "flex items-center py-2 px-3 rounded-md cursor-pointer transition-colors",
                    selectedNodeId === node.id ? "bg-zinc-200 text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                  onClick={() => onSelectNode(node.id)}
                >
                  <span className="mr-2 text-zinc-400">
                    {node.type === 'folder' ? <Folder size={16} /> : <FileText size={16} />}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{node.name}</span>
                    <span className="text-xs text-zinc-400 truncate">
                      {node.type === 'note' ? 'Note' : 'Folder'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-400 text-sm">No results found</div>
            )}
          </div>
        ) : (
          (rootNodes || []).map(node => (
            <TreeItem 
              key={node.id} 
              node={node} 
              level={0} 
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onCreateNode={onCreateNode}
              onDeleteNode={onDeleteNode}
              onRenameNode={onRenameNode}
              onRelocateNode={onRelocateNode}
              onReorderNode={onReorderNode}
              onUpdateColor={onUpdateColor}
              onUpdateIcon={onUpdateIcon}
              newlyCreatedNodeId={newlyCreatedNodeId}
              onClearNewlyCreated={onClearNewlyCreated}
            />
          ))
        )}
      </div>
    </div>
  );
}
