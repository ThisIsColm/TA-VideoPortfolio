import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router';
import { useApp } from '../lib/AppContext';
import { Button } from '../components/ghost/Button';
import { Input, Textarea } from '../components/ghost/Input';
import { ArrowLeft, ExternalLink, GripVertical, X, Plus, Search, Check, Star } from 'lucide-react';
import { toast } from 'sonner';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import * as api from '../lib/api';
import type { CollectionDetail, GhostPost } from '../lib/api';

// ─── Constants ───────────────────────────────────────
const ITEM_TYPE = 'VIDEO_ROW';

// ─── Draggable Video Row ─────────────────────────────
interface DraggableVideoRowProps {
  post: GhostPost;
  item: api.CollectionItem;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  onRemove: () => void;
  isHero: boolean;
  onSetHero: () => void;
}

function DraggableVideoRow({ post, item, index, moveRow, onRemove, isHero, onSetHero }: DraggableVideoRowProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(dragItem: { index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = dragItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveRow(dragIndex, hoverIndex);
      dragItem.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center gap-4 bg-[var(--bg-secondary)] border rounded-[var(--radius-md)] p-4 transition-all ${isDragging
        ? 'opacity-40 border-white/20 scale-[0.98]'
        : isOver
          ? 'border-white/30 bg-white/[0.04]'
          : 'border-[var(--border-subtle)]'
        }`}
    >
      <div className="cursor-grab active:cursor-grabbing text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="w-28 h-16 rounded-[var(--radius-sm)] overflow-hidden flex-shrink-0 bg-[var(--bg-tertiary)]">
        <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] font-medium text-[var(--text-primary)] truncate">{post.title}</h4>
        <p className="text-[11px] font-mono text-[var(--text-tertiary)] mt-0.5 truncate">
          {post.year} • {post.tags.slice(0, 3).join(', ')}
        </p>
      </div>

      <span className="text-[10px] font-mono text-[var(--text-tertiary)] tabular-nums flex-shrink-0 mr-2">
        #{index + 1}
      </span>

      <button
        onClick={onSetHero}
        className={`p-2 rounded-full transition-all flex-shrink-0 mr-1 ${isHero
          ? 'text-[var(--accent-brand)] bg-[var(--accent-brand)]/10'
          : 'text-[var(--text-tertiary)] hover:text-[var(--accent-brand)] hover:bg-[var(--accent-brand)]/5'
          }`}
        title={isHero ? "Current Hero Image" : "Set as Hero Image"}
      >
        <Star className={`w-4 h-4 ${isHero ? 'fill-current' : ''}`} />
      </button>

      <button
        onClick={onRemove}
        className="p-2 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all flex-shrink-0"
        title="Remove from collection"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Add Videos Modal ────────────────────────────────
interface AddVideosModalProps {
  collectionId: string;
  existingPostIds: Set<string>;
  ghostPosts: GhostPost[];
  onAdd: (post: GhostPost) => void;
  onClose: () => void;
}

function AddVideosModal({ collectionId, existingPostIds, ghostPosts, onAdd, onClose }: AddVideosModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filteredPosts = searchQuery
    ? ghostPosts.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : ghostPosts;

  const handleAdd = async (post: GhostPost) => {
    if (existingPostIds.has(post.id)) return;
    if (existingPostIds.size >= 6) {
      toast.error('Limit reached (max 6 videos)');
      return;
    }
    setAddingId(post.id);
    try {
      await api.addCollectionItem(collectionId, post.id, post.slug);
      onAdd(post);
      toast.success(`Added "${post.title}"`, { duration: 1500 });
    } catch (err: any) {
      if (err.status === 409) {
        toast.error('Already in collection');
      } else {
        toast.error('Failed to add video');
      }
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--border-medium)] rounded-[var(--radius-lg)] shadow-[var(--shadow-overlay)] overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-medium text-[var(--text-primary)]">Add Videos</h2>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              Click a video to add it ({existingPostIds.size} / 6 used)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-hover)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[rgba(255,255,255,0.04)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all focus:outline-none focus:border-[var(--border-active)]"
            />
          </div>
        </div>

        {/* Video List */}
        <div className="overflow-y-auto flex-1">
          {filteredPosts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[13px] text-[var(--text-secondary)]">No videos found</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isAdded = existingPostIds.has(post.id);
              const isAdding = addingId === post.id;

              return (
                <button
                  key={post.id}
                  onClick={() => !isAdded && !isAdding && handleAdd(post)}
                  disabled={isAdded || isAdding}
                  className={`w-full flex items-center gap-4 px-6 py-3 text-left border-b border-[var(--border-subtle)] last:border-b-0 transition-all ${isAdded
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[var(--accent-hover)] cursor-pointer'
                    }`}
                >
                  <div className="w-20 h-12 rounded-[var(--radius-sm)] overflow-hidden flex-shrink-0 bg-[var(--bg-tertiary)]">
                    <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{post.title}</p>
                    <p className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5 truncate">
                      {post.tags.slice(0, 3).join(' • ')} {post.year && `• ${post.year}`}
                    </p>
                  </div>
                  <span className="flex-shrink-0">
                    {isAdded ? (
                      <span className="text-[10px] uppercase tracking-wider font-mono text-[var(--text-tertiary)] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Added
                      </span>
                    ) : isAdding ? (
                      <span className="text-[10px] uppercase tracking-wider font-mono text-[var(--text-tertiary)]">Adding...</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider font-mono text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]">
                        Add →
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Edit Collection Page ───────────────────────
export default function EditCollection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshCollections, ghostPosts } = useApp();

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    intro: '',
    password: '',
    heroItemId: '',
  });

  const orderChangedRef = useRef(false);

  // Load collection
  useEffect(() => {
    if (!id) return;
    api.fetchCollection(id)
      .then(({ collection }) => {
        setCollection(collection);
        const heroId = collection.heroItemId || (collection.items.length > 0 ? collection.items[0].id : '');
        setFormData({
          title: collection.title,
          slug: collection.slug,
          intro: collection.intro,
          password: '',
          heroItemId: heroId,
        });
      })
      .catch(() => setError('Collection not found'))
      .finally(() => setLoading(false));
  }, [id]);

  // Map items to posts
  const itemPosts = collection
    ? collection.items.map(item => {
      const post = ghostPosts.find(p => p.id === item.ghostPostId || p.slug === item.ghostSlug);
      return { item, post };
    }).filter((x): x is { item: api.CollectionItem; post: GhostPost } => !!x.post)
    : [];

  const existingPostIds = new Set(itemPosts.map(ip => ip.post.id));

  // ─── Drag & Drop Reorder ──────────────────────────
  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    if (!collection) return;
    const newItems = [...collection.items];
    const [removed] = newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, removed);
    setCollection({ ...collection, items: newItems });
    orderChangedRef.current = true;
  }, [collection]);

  const persistOrder = useCallback(async () => {
    if (!collection || !orderChangedRef.current) return;
    try {
      await api.reorderCollectionItems(collection.id, collection.items.map(i => i.id));
      toast.success('Order saved');
      orderChangedRef.current = false;
    } catch {
      toast.error('Failed to save order');
    }
  }, [collection]);

  // Save order on any change to items (debounced via mouseup)
  useEffect(() => {
    const handleMouseUp = () => {
      if (collection) {
        persistOrder();
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [persistOrder, collection]);

  // ─── Actions ──────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!collection) return;
    setSaving(true);
    setError('');

    try {
      await api.updateCollection(collection.id, {
        title: formData.title,
        slug: formData.slug,
        intro: formData.intro,
        password: formData.password || undefined,
        heroItemId: formData.heroItemId || null,
      });
      await refreshCollections();
      toast.success('Collection saved');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!collection) return;
    try {
      await api.removeCollectionItem(collection.id, itemId);

      const newItems = collection.items.filter(i => i.id !== itemId);

      // If we removed the hero, reassign it
      let newHeroId = formData.heroItemId;
      if (itemId === formData.heroItemId) {
        newHeroId = newItems.length > 0 ? newItems[0].id : '';
      }

      setCollection({
        ...collection,
        items: newItems,
      });

      setFormData(prev => ({ ...prev, heroItemId: newHeroId }));

      // Auto-save if the hero was changed due to removal
      if (newHeroId !== formData.heroItemId) {
        await api.updateCollection(collection.id, {
          title: formData.title,
          slug: formData.slug,
          intro: formData.intro,
          heroItemId: newHeroId
        });
      }

      toast.success('Video removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove item');
    }
  };

  const handleSetHero = async (itemId: string) => {
    if (!collection) return;

    // Optimistic UI update
    setFormData(prev => ({ ...prev, heroItemId: itemId }));

    try {
      await api.updateCollection(collection.id, { heroItemId: itemId });
      toast.success('Hero image updated');
    } catch (err: any) {
      toast.error('Failed to update hero image');
      // Revert on failure
      setFormData(prev => ({ ...prev, heroItemId: collection.heroItemId || '' }));
    }
  };

  const handleAddVideo = (post: GhostPost) => {
    if (!collection) return;
    if (collection.items.length >= 6) {
      toast.error('Limit reached (max 6 videos)');
      return;
    }
    const newItem: api.CollectionItem = {
      id: crypto.randomUUID(),
      ghostPostId: post.id,
      ghostSlug: post.slug,
      sortOrder: collection.items.length,
    };
    setCollection({
      ...collection,
      items: [...collection.items, newItem],
    });
  };

  const copyLink = () => {
    const url = `https://portfolio.tinyark.com/p/${formData.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard', { duration: 2000 });
  };

  // ─── Render ───────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 md:p-12 lg:p-16">
        <div className="text-[15px] text-[var(--text-secondary)]">Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 md:p-12 lg:p-16">
        {/* Header */}
        <div className="flex items-start justify-between mb-12 gap-4 flex-col md:flex-row">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-6 -ml-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Collections
            </Button>
            <h1 className="text-[32px] leading-[40px] font-light text-[var(--text-primary)] tracking-tight">
              Edit Collection
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="secondary" onClick={copyLink}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button onClick={() => handleSubmit()} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-md)] text-red-400 text-[13px]">
            {error}
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left: Form */}
          <div className="lg:w-[380px] flex-shrink-0">
            <h2 className="text-[11px] uppercase tracking-widest font-mono text-[var(--text-tertiary)] mb-6">
              Details
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <Input
                label="Collection Name"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <Input
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="font-mono"
              />

              <Textarea
                label="Intro"
                value={formData.intro}
                onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                rows={3}
              />

              <Input
                label="Password (Optional)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                helperText="Leave empty to keep the current password (if any)"
              />
            </form>
          </div>

          {/* Right: Videos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] uppercase tracking-widest font-mono text-[var(--text-tertiary)]">
                Videos ({itemPosts.length})
              </h2>
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(true)}
                disabled={itemPosts.length >= 6}
                title={itemPosts.length >= 6 ? "Limit of 6 videos reached" : ""}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Videos {itemPosts.length >= 6 && '(Full)'}
              </Button>
            </div>

            {itemPosts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--border-medium)] rounded-[var(--radius-md)]">
                <p className="text-[15px] text-[var(--text-secondary)] mb-4">
                  No videos added yet
                </p>
                <Button variant="secondary" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Video
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {itemPosts.map(({ item, post }, index) => (
                  <DraggableVideoRow
                    key={item.id}
                    post={post}
                    item={item}
                    index={index}
                    moveRow={moveRow}
                    onRemove={() => removeItem(item.id)}
                    isHero={formData.heroItemId === item.id}
                    onSetHero={() => handleSetHero(item.id)}
                  />
                ))}
              </div>
            )}

            {itemPosts.length > 0 && (
              <p className="text-[10px] text-[var(--text-tertiary)] mt-4 font-mono">
                Drag to reorder • Changes save automatically
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Videos Modal */}
      {showAddModal && (
        <AddVideosModal
          collectionId={collection.id}
          existingPostIds={existingPostIds}
          ghostPosts={ghostPosts}
          onAdd={handleAddVideo}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </DndProvider>
  );
}