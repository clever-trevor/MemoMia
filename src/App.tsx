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
  Clock, ArrowUpDown, History, Calendar, Type, Hash, Plus, Pencil, FolderPlus, FilePlus
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
            <div className="w-64 h-64 rounded-2xl flex items-center justify-center mb-3 shadow-inner overflow-hidden relative" style={{ backgroundColor: 'var(--hover-bg)' }}>
              <img 
                src="https://storage.googleapis.com/aistudio-images/MemoMia-25-trans.png" 
                alt="MemoMia" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />

            </div>
            <p className="text-[16px] mt-1 font-medium tracking-widest uppercase opacity-60" style={{ color: 'var(--text-secondary)' }}>Here I flow again</p>
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

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  nodeName,
  isFolder
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  nodeName: string;
  isFolder: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in duration-200"
        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Delete {isFolder ? 'Folder' : 'Note'}?</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <span className="font-medium" style={{ color: 'var(--text-primary)' }}>"{nodeName}"</span>?
            {isFolder && " All nested items will be permanently deleted."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
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
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);
  const [nodeToDeleteId, setNodeToDeleteId] = useState<string | null>(null);

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
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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

      // Task 4: Initial state - start with a single folder called RenameMe
      if (fetchedNodes.length === 0 && user && !loading) {
        const createInitialFolder = async () => {
          try {
            await addDoc(collection(db, 'nodes'), {
              parentId: null,
              name: 'RenameMe',
              type: 'folder',
              order: 0,
              content: '',
              ownerId: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            console.error("Error creating initial folder:", err);
          }
        };
        createInitialFolder();
      }
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

  const [namingModal, setNamingModal] = useState<{
    isOpen: boolean;
    type: 'create' | 'rename';
    nodeType?: 'folder' | 'note';
    parentId?: string | null;
    nodeId?: string;
    initialValue?: string;
  }>({ isOpen: false, type: 'create' });

  const createNode = useCallback((parentId: string | null, type: 'folder' | 'note') => {
    setNamingModal({
      isOpen: true,
      type: 'create',
      nodeType: type,
      parentId,
      initialValue: type === 'folder' ? 'New Folder' : 'New Note'
    });
  }, []);

  const performCreateNode = async (parentId: string | null, type: 'folder' | 'note', name: string) => {
    if (!user) return;
    
    const siblings = nodes.filter(n => n.parentId === parentId);
    const maxOrder = siblings.reduce((max, n) => Math.max(max, n.order || 0), -1);

    const newNode = {
      parentId,
      name,
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
  };

  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId) {
      const node = nodes.find(n => n.id === nodeId);
      if (node?.type === 'folder') {
        const allFolders = nodes.filter(n => n.type === 'folder');
        if (allFolders.length <= 1) {
          setError("You must have at least one folder. Please rename this one instead of deleting it.");
          setTimeout(() => setError(null), 3000);
          return;
        }
      }
    }
    setNodeToDeleteId(nodeId);
  }, [nodes]);

  const confirmDelete = async () => {
    if (!nodeToDeleteId) return;
    
    // Recursive delete for folders
    const deleteRecursive = async (id: string) => {
      const children = nodes.filter(n => n.parentId === id);
      for (const child of children) {
        await deleteRecursive(child.id);
      }
      await deleteDoc(doc(db, 'nodes', id));
    };

    try {
      const idToDelete = nodeToDeleteId;
      setNodeToDeleteId(null);
      await deleteRecursive(idToDelete);
      if (selectedNodeId === idToDelete) setSelectedNodeId(null);
    } catch (err) {
      console.error("Delete error:", err);
      setNodeToDeleteId(null);
    }
  };

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
      {isOffline && (
        <div className="absolute top-4 right-4 z-[200] flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <LucideIcons.CloudOff size={12} />
          Offline Mode (Cached)
        </div>
      )}
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

      <DeleteConfirmModal 
        isOpen={!!nodeToDeleteId}
        onClose={() => setNodeToDeleteId(null)}
        onConfirm={confirmDelete}
        nodeName={nodes.find(n => n.id === nodeToDeleteId)?.name || ''}
        isFolder={nodes.find(n => n.id === nodeToDeleteId)?.type === 'folder'}
      />

      <NamingModal
        isOpen={namingModal.isOpen}
        onClose={() => setNamingModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={(name) => {
          if (namingModal.type === 'create') {
            performCreateNode(namingModal.parentId!, namingModal.nodeType!, name);
          } else if (namingModal.type === 'rename' && namingModal.nodeId) {
            renameNode(namingModal.nodeId, name);
          }
        }}
        initialValue={namingModal.initialValue}
        title={namingModal.type === 'create' ? `Name your ${namingModal.nodeType}` : `Rename ${namingModal.nodeType}`}
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
                        <h2 className="text-sm sm:text-lg font-medium truncate" style={{ color: 'var(--text-primary)' }}>{selectedNode.name}</h2>
                        <button 
                          onClick={() => setNamingModal({
                            isOpen: true,
                            type: 'rename',
                            nodeId: selectedNode.id,
                            initialValue: selectedNode.name,
                            nodeType: selectedNode.type
                          })}
                          className="p-1 hover:bg-zinc-100 rounded-md transition-colors"
                          title="Rename"
                        >
                          <Pencil size={14} className="text-zinc-400" />
                        </button>
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
          <div className="flex-1 p-2 sm:p-6 overflow-hidden">
            {selectedNode ? (
              selectedNode.type === 'note' ? (
                <Editor 
                  content={selectedNode.content} 
                  onChange={(content) => updateContent(selectedNode.id, content)} 
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-8 border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/30 transition-all">
                  <div className="relative">
                    <div className="absolute -inset-6 bg-zinc-100/50 rounded-full blur-2xl animate-pulse" />
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center relative border border-zinc-100 shadow-sm">
                      <Folder size={48} className="text-zinc-200" style={{ color: selectedNode.color || 'var(--text-secondary)', opacity: 0.3 }} />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {newlyCreatedNodeId === selectedNode.id ? "Folder created! What's next?" : `${selectedNode.name} is empty`}
                    </h3>
                    <p className="text-sm max-w-[300px]" style={{ color: 'var(--text-secondary)' }}>
                      {newlyCreatedNodeId === selectedNode.id ? "Start by adding a note or a subfolder inside." : "What would you like to create in this folder?"}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => createNode(selectedNode.id, 'note')}
                      className="flex items-center gap-3 px-8 py-4 bg-white border border-zinc-200 rounded-2xl text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm group min-w-[180px]"
                      style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <FilePlus size={20} className="group-hover:scale-110 transition-transform" style={{ color: selectedNode.color || 'var(--accent-color)' }} />
                      <span className="font-semibold">New Note</span>
                    </button>
                    <button
                      onClick={() => createNode(selectedNode.id, 'folder')}
                      className="flex items-center gap-3 px-8 py-4 bg-white border border-zinc-200 rounded-2xl text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm group min-w-[180px]"
                      style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <FolderPlus size={20} className="group-hover:scale-110 transition-transform" style={{ color: selectedNode.color || 'var(--accent-color)' }} />
                      <span className="font-semibold">New Subfolder</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-6">
                <div className="relative">
                  <div className="absolute -inset-4 bg-zinc-100/50 rounded-full blur-xl animate-pulse" />
                  <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center relative border border-zinc-100 shadow-sm">
                    <FileText size={40} className="text-zinc-200" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm italic font-medium" style={{ color: 'var(--text-secondary)' }}>Select a note from the sidebar or get started by creating a new folder</p>
                </div>
                <button
                  onClick={() => createNode(null, 'folder')}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-full text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm group"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <FolderPlus size={18} className="group-hover:scale-110 transition-transform" style={{ color: 'var(--accent-color)' }} />
                  <span className="font-medium">Create New Folder</span>
                </button>
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

const NamingModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialValue = '', 
  title = 'Name your note' 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (name: string) => void; 
  initialValue?: string;
  title?: string;
}) => {
  const [name, setName] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border animate-in fade-in zoom-in duration-200"
        style={{ 
          backgroundColor: 'var(--bg-main)', 
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--hover-bg)' }}>
              <Type size={20} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                onConfirm(name.trim());
                onClose();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Enter name..."
            className="w-full px-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-opacity-50"
            style={{ 
              backgroundColor: 'var(--hover-bg)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--accent-color)'
            } as React.CSSProperties}
          />

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 font-medium rounded-xl transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: 'var(--hover-bg)',
                color: 'var(--text-secondary)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (name.trim()) {
                  onConfirm(name.trim());
                  onClose();
                }
              }}
              disabled={!name.trim()}
              className="flex-1 px-4 py-2.5 font-medium rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: 'var(--accent-color)',
                color: 'var(--bg-main)'
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
