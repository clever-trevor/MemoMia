import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  collection, onSnapshot, query, where, 
  addDoc, updateDoc, deleteDoc, doc, 
  Timestamp, serverTimestamp, getDocFromServer
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { Node } from './types';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import { cn } from './lib/utils';
import { 
  LogIn, LogOut, Loader2, AlertCircle, Folder, FileText, 
  Menu, X, Settings as SettingsIcon, ChevronRight, 
  Clock, ArrowUpDown, History, Calendar, Type, Hash
} from 'lucide-react';
import { format } from 'date-fns';

const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const getWordCount = (text: string) => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const RecentNotesDropdown = ({ 
  nodes, 
  onSelect, 
  isOpen, 
  onClose 
}: { 
  nodes: Node[]; 
  onSelect: (id: string) => void; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as globalThis.Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const sortedNotes = useMemo(() => {
    return nodes
      .filter(n => n.type === 'note')
      .sort((a, b) => {
        const timeA = a[sortBy]?.toMillis() || 0;
        const timeB = b[sortBy]?.toMillis() || 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      })
      .slice(0, 10);
  }, [nodes, sortBy, sortOrder]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 mt-2 w-72 rounded-xl shadow-2xl border z-[110] overflow-hidden"
      style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
    >
      <div className="p-3 border-b flex items-center justify-between bg-zinc-50/50" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          <History size={14} />
          Recent Notes
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setSortBy(sortBy === 'createdAt' ? 'updatedAt' : 'createdAt')}
            className="p-1 hover:bg-zinc-200 rounded transition-colors text-[10px] font-medium"
            style={{ color: 'var(--text-secondary)' }}
            title={`Sorting by ${sortBy === 'createdAt' ? 'Creation' : 'Update'} Date`}
          >
            {sortBy === 'createdAt' ? 'Created' : 'Updated'}
          </button>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 hover:bg-zinc-200 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowUpDown size={12} className={cn(sortOrder === 'asc' && "rotate-180 transition-transform")} />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto p-1">
        {(sortedNotes || []).length === 0 ? (
          <div className="p-8 text-center text-xs italic" style={{ color: 'var(--text-secondary)' }}>
            No notes found
          </div>
        ) : (
          (sortedNotes || []).map(note => (
            <button
              key={note.id}
              onClick={() => {
                onSelect(note.id);
                onClose();
              }}
              className="w-full text-left p-2.5 rounded-lg hover:bg-zinc-100 transition-colors group flex flex-col gap-0.5"
            >
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: note.color || 'var(--text-secondary)' }} />
                <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{note.name}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                <Clock size={10} />
                <span>{format(note[sortBy]?.toDate() || new Date(), 'MMM d, h:mm a')}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  theme, 
  setTheme,
  appName,
  setAppName,
  fontFamily,
  setFontFamily
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  theme: string; 
  setTheme: (theme: any) => void;
  appName: string;
  setAppName: (name: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
}) => {
  if (!isOpen) return null;

  const fonts = [
    { name: 'Inter (Default)', value: 'Inter, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Comic Sans', value: '"Comic Sans MS", cursive, sans-serif' },
    { name: 'Courier New', value: '"Courier New", Courier, monospace' },
    { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
    { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Impact', value: 'Impact, sans-serif' },
    { name: 'Lucida Console', value: '"Lucida Console", Monaco, monospace' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border"
        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>App Name</label>
            <input 
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border outline-none transition-all"
              style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="App Name"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Font Family</label>
            <select 
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border outline-none transition-all bg-transparent"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              {(fonts || []).map(f => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value, backgroundColor: 'var(--bg-main)' }}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Theme</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'light', name: 'Light' },
                { id: 'dark', name: 'Dark' },
                { id: 'dark-blue', name: 'Dark Blue' },
                { id: 'unicorn', name: 'Unicorn' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                    theme === t.id ? "border-zinc-900 bg-zinc-50" : "border-transparent bg-zinc-100/50 hover:bg-zinc-100"
                  )}
                  style={{ 
                    borderColor: theme === t.id ? 'var(--accent-color)' : 'transparent',
                    backgroundColor: theme === t.id ? 'var(--hover-bg)' : undefined,
                    color: 'var(--text-primary)'
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-center pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-inner overflow-hidden relative" style={{ backgroundColor: 'var(--hover-bg)' }}>
              <img 
                src="https://storage.googleapis.com/applet-assets-public/edc00a38-45bc-47a8-94bd-a10cd673fd88/logo_new.png" 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <LucideIcons.StickyNote size={32} className="text-zinc-400" />
              </div>
            </div>
            <h1 className="italic text-2xl" style={{ color: 'var(--text-primary)' }}>{appName}</h1>
            <p className="text-[10px] mt-1 font-medium tracking-widest uppercase opacity-60" style={{ color: 'var(--text-secondary)' }}>Here I flow again</p>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--border-color)' }}>
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: 'var(--accent-color)', color: 'var(--bg-main)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newlyCreatedNodeId, setNewlyCreatedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'dark-blue' | 'unicorn'>('light');
  const [appName, setAppName] = useState('MemoMia');
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('to-note-theme') as any;
    if (savedTheme) setTheme(savedTheme);
    
    const savedAppName = localStorage.getItem('to-note-app-name');
    if (savedAppName) setAppName(savedAppName);

    const savedFontFamily = localStorage.getItem('to-note-font-family');
    if (savedFontFamily) setFontFamily(savedFontFamily);
  }, []);

  // Apply theme and settings to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('to-note-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('to-note-app-name', appName);
  }, [appName]);

  useEffect(() => {
    document.documentElement.style.fontFamily = fontFamily;
    localStorage.setItem('to-note-font-family', fontFamily);
  }, [fontFamily]);

  // Connection test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          setError("Please check your Firebase configuration. The client appears to be offline.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setNodes([]);
      return;
    }

    const q = query(collection(db, 'nodes'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNodes = (snapshot.docs || []).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Node[];
      setNodes(fetchedNodes);
    }, (err) => {
      console.error("Firestore error:", err);
      setError("Failed to sync notes. Please check your permissions.");
    });

    return unsubscribe;
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = () => signOut(auth);

  const createNode = useCallback(async (parentId: string | null, type: 'folder' | 'note') => {
    if (!user) return;
    
    const siblings = nodes.filter(n => n.parentId === parentId);
    const maxOrder = siblings.reduce((max, n) => Math.max(max, n.order || 0), -1);

    const newNode = {
      parentId,
      name: type === 'folder' ? 'New Folder' : 'New Note',
      type,
      order: maxOrder + 1,
      content: '',
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'nodes'), newNode);
      setSelectedNodeId(docRef.id);
      setNewlyCreatedNodeId(docRef.id);
    } catch (err) {
      console.error("Create error:", err);
    }
  }, [user]);

  const deleteNode = useCallback(async (nodeId: string) => {
    // Recursive delete for folders
    const deleteRecursive = async (id: string) => {
      const children = nodes.filter(n => n.parentId === id);
      for (const child of children) {
        await deleteRecursive(child.id);
      }
      await deleteDoc(doc(db, 'nodes', id));
    };

    if (window.confirm("Are you sure you want to delete this? All nested items will be deleted.")) {
      try {
        await deleteRecursive(nodeId);
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  }, [nodes, selectedNodeId]);

  const renameNode = useCallback(async (nodeId: string, newName: string) => {
    try {
      await updateDoc(doc(db, 'nodes', nodeId), {
        name: newName,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Rename error:", err);
    }
  }, []);

  const updateContent = useCallback(async (nodeId: string, content: string) => {
    try {
      await updateDoc(doc(db, 'nodes', nodeId), {
        content,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Update error:", err);
    }
  }, []);

  const updateColor = useCallback(async (nodeId: string, color: string) => {
    try {
      await updateDoc(doc(db, 'nodes', nodeId), {
        color,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Update color error:", err);
    }
  }, []);

  const updateIcon = useCallback(async (nodeId: string, icon: string) => {
    try {
      await updateDoc(doc(db, 'nodes', nodeId), {
        icon,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Update icon error:", err);
    }
  }, []);

  const relocateNode = useCallback(async (nodeId: string, newParentId: string | null) => {
    if (nodeId === newParentId) return;

    // Prevent moving a node into its own descendant
    const isDescendant = (parentId: string, targetId: string): boolean => {
      const children = nodes.filter(n => n.parentId === parentId);
      if (children.some(c => c.id === targetId)) return true;
      return children.some(c => isDescendant(c.id, targetId));
    };

    if (newParentId && isDescendant(nodeId, newParentId)) {
      console.error("Cannot move a folder into its own subfolder");
      return;
    }

    try {
      await updateDoc(doc(db, 'nodes', nodeId), {
        parentId: newParentId,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Move error:", err);
    }
  }, [nodes]);

  const reorderNode = useCallback(async (nodeId: string, direction: 'up' | 'down') => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Stable sort for siblings to ensure predictable movement even with missing/duplicate orders
    const siblings = nodes.filter(n => n.parentId === node.parentId)
      .sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
      });
    
    const currentIndex = siblings.findIndex(n => n.id === nodeId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < siblings.length) {
      const newSiblings = [...siblings];
      // Swap the items
      [newSiblings[currentIndex], newSiblings[targetIndex]] = [newSiblings[targetIndex], newSiblings[currentIndex]];

      try {
        // Re-index all siblings to ensure they have unique, sequential orders
        // This fixes any existing nodes with duplicate or missing orders
        const updates = (newSiblings || []).map((n, index) => 
          updateDoc(doc(db, 'nodes', n.id), { 
            order: index,
            updatedAt: serverTimestamp()
          })
        );
        await Promise.all(updates);
      } catch (err) {
        console.error("Move error:", err);
      }
    }
  }, [nodes]);

  const getBreadcrumbs = (nodeId: string | null) => {
    const path: Node[] = [];
    let currentId = nodeId;
    while (currentId) {
      const node = nodes.find(n => n.id === currentId);
      if (node) {
        path.unshift(node);
        currentId = node.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const breadcrumbs = getBreadcrumbs(selectedNodeId);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-5xl italic text-zinc-900">{appName}</h1>
            <p className="text-zinc-500">Organize your thoughts in a hierarchical tree structure.</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-lg"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden relative" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        theme={theme} 
        setTheme={setTheme} 
        appName={appName}
        setAppName={setAppName}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
      />
      <div className={`
        fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity lg:hidden
        ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `} onClick={() => setIsSidebarOpen(false)} />

        <Sidebar 
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            const node = nodes.find(n => n.id === id);
            if (node?.type === 'note') {
              setIsSidebarOpen(false);
            }
          }}
          onCreateNode={createNode}
          onDeleteNode={deleteNode}
          onRenameNode={renameNode}
          onRelocateNode={relocateNode}
          onReorderNode={reorderNode}
          onUpdateColor={updateColor}
          onUpdateIcon={updateIcon}
          newlyCreatedNodeId={newlyCreatedNodeId}
          onClearNewlyCreated={() => setNewlyCreatedNodeId(null)}
          isOpen={isSidebarOpen}
          onOpenSettings={() => setIsSettingsOpen(true)}
          appName={appName}
          isRecentOpen={isRecentOpen}
          setIsRecentOpen={setIsRecentOpen}
        />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        {error && (
          <div className="absolute top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 shadow-md">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:text-red-900">×</button>
          </div>
        )}

        <header className="h-16 border-b border-zinc-200 flex items-center justify-between px-4 sm:px-6 shrink-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 hover:bg-zinc-100 rounded-md lg:hidden"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col min-w-0 relative">
              <div className="flex items-center gap-2">
                <div className="flex flex-col min-w-0">
                  {selectedNode ? (
                    <>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs overflow-hidden whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setSelectedNodeId(null);
                              setIsSidebarOpen(true);
                            }}
                            className="hover:underline"
                          >
                            {appName}
                          </button>
                        </div>
                        {(breadcrumbs.slice(0, -1) || []).map(node => (
                          <div key={node.id} className="flex items-center gap-1">
                            <ChevronRight size={10} />
                            <button 
                              onClick={() => {
                                setSelectedNodeId(node.id);
                                setIsSidebarOpen(true);
                              }}
                              className="hover:underline truncate max-w-[80px] sm:max-w-[120px]"
                            >
                              {node.name}
                            </button>
                          </div>
                        ))}
                        {breadcrumbs.length > 0 && <ChevronRight size={10} />}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedNode.icon ? (
                          (() => {
                            const IconComp = (LucideIcons as any)[selectedNode.icon] || FileText;
                            return <IconComp size={18} style={{ color: selectedNode.color || 'var(--text-secondary)' }} />;
                          })()
                        ) : (
                          selectedNode.type === 'folder' ? (
                            <Folder size={18} style={{ color: selectedNode.color || 'var(--text-secondary)' }} />
                          ) : (
                            <FileText size={18} style={{ color: selectedNode.color || 'var(--text-secondary)' }} />
                          )
                        )}
                        <h2 className="text-base sm:text-lg font-medium truncate" style={{ color: 'var(--text-primary)' }}>{selectedNode.name}</h2>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-medium italic" style={{ color: 'var(--text-secondary)' }}>{appName}</h2>
                    </div>
                  )}
                </div>
                
                <RecentNotesDropdown 
                  nodes={nodes} 
                  onSelect={setSelectedNodeId} 
                  isOpen={isRecentOpen} 
                  onClose={() => setIsRecentOpen(false)} 
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={user.photoURL || ''} 
                alt={user.displayName || ''} 
                className="w-8 h-8 rounded-full border"
                style={{ borderColor: 'var(--border-color)' }}
                referrerPolicy="no-referrer"
              />
              <span className="text-sm font-medium hidden sm:inline" style={{ color: 'var(--text-primary)' }}>{user.displayName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-zinc-100 rounded-md transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 overflow-hidden">
            {selectedNode ? (
              selectedNode.type === 'note' ? (
                <Editor 
                  content={selectedNode.content} 
                  onChange={(content) => updateContent(selectedNode.id, content)} 
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4 border-2 border-dashed border-zinc-100 rounded-xl">
                  <div className="p-4 bg-zinc-50 rounded-full">
                    <Folder size={32} className="text-zinc-200" />
                  </div>
                  <p className="text-sm">This is a folder. Select a note inside to edit.</p>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
                <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center">
                  <FileText size={32} className="text-zinc-200" />
                </div>
                <p className="text-sm italic">Select or create a note from the sidebar</p>
              </div>
            )}
          </div>

          {selectedNode && selectedNode.type === 'note' && (
            <footer className="h-10 border-t flex items-center justify-center gap-6 px-6 shrink-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                <Calendar size={12} />
                <span>Created: {format(selectedNode.createdAt?.toDate() || new Date(), 'MMM dd yyyy HH:mm')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                <Clock size={12} />
                <span>Updated: {format(selectedNode.updatedAt?.toDate() || new Date(), 'MMM dd yyyy HH:mm')}</span>
              </div>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
}
