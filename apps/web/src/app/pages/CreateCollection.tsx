import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../lib/AppContext';
import { Button } from '../components/ghost/Button';
import { Input, Textarea } from '../components/ghost/Input';
import { ArrowLeft, Search, Grid3x3, List } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { motion } from 'motion/react';
import * as api from '../lib/api';

export default function CreateCollection() {
  const navigate = useNavigate();
  const { ghostPosts, postsLoading, searchPosts, filterPostsByTag, refreshCollections } = useApp();

  // Wizard State
  const [step, setStep] = useState<'select-videos' | 'details'>('select-videos');

  // Posts Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());

  // Form State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    intro: '',
    password: '',
  });

  const allTags = Array.from(new Set(ghostPosts.flatMap(p => p.tags)));

  const filteredPosts = searchQuery
    ? searchPosts(searchQuery)
    : selectedTag
      ? filterPostsByTag(selectedTag)
      : ghostPosts;

  const togglePost = (id: string) => {
    setSelectedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 6) {
          // You might want to import toast here if it's available, 
          // but for now I'll just prevent the addition.
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      title: value,
      slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // 1. Create Collection
      const { collection } = await api.createCollection({
        title: formData.title,
        slug: formData.slug,
        intro: formData.intro,
        password: formData.password || undefined,
      } as any);

      // 2. Add Selected Videos
      const selectedPostsData = ghostPosts.filter(p => selectedPostIds.has(p.id));
      let firstItemId: string | null = null;
      for (const [index, post] of selectedPostsData.entries()) {
        try {
          const { item } = await api.addCollectionItem(collection.id, post.id, post.slug);
          if (index === 0) firstItemId = item.id;
        } catch (addErr) {
          console.error(`Failed to add post ${post.slug} to collection:`, addErr);
        }
      }

      // 3. Set Hero (first video by default)
      if (firstItemId) {
        await api.updateCollection(collection.id, { heroItemId: firstItemId });
      }

      await refreshCollections();
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to create collection');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'select-videos') {
    return (
      <div className="min-h-screen relative pb-24">
        {/* Header Bar */}
        <div className="sticky top-0 z-50 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] px-6 md:px-12 lg:px-16 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/admin')} className="-ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-[24px] font-light text-[var(--text-primary)]">
              Step 1: Select Videos
            </h1>
            <span className="text-[12px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-2 py-1 rounded border border-[var(--border-subtle)]">
              Max 6 videos
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-[rgba(255,255,255,0.04)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-[var(--duration-fast)] focus:outline-none focus:border-[var(--border-active)]"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="h-12 px-4 bg-[rgba(255,255,255,0.04)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[15px] text-[var(--text-primary)] transition-all duration-[var(--duration-fast)] focus:outline-none focus:border-[var(--border-active)]"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

              <div className="flex items-center border border-[var(--border-medium)] rounded-[var(--radius-sm)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-[rgba(255,255,255,0.08)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-hover)]'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-[rgba(255,255,255,0.08)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-hover)]'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Area */}
        {postsLoading ? (
          <div className="p-6 md:p-12 lg:p-16">
            <div className="text-[15px] text-[var(--text-secondary)]">Loading posts...</div>
          </div>
        ) : ghostPosts.length === 0 ? (
          <div className="p-6 md:p-12 lg:p-16 text-center py-20">
            <p className="text-[15px] text-[var(--text-secondary)] mb-4">No posts found.</p>
          </div>
        ) : (
          <div className="p-6 md:p-12 lg:p-16">
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'space-y-4'}>
              {filteredPosts.map((post, index) => (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  key={post.id}
                  onClick={() => togglePost(post.id)}
                  className={`relative bg-[var(--bg-secondary)] border rounded-[var(--radius-lg)] overflow-hidden transition-all duration-[var(--duration-fast)] cursor-pointer shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-medium)] ${selectedPostIds.has(post.id) ? 'border-white/40 ring-1 ring-white/20' : 'border-[var(--border-subtle)] hover:border-[var(--border-active)]'} ${viewMode === 'list' ? 'flex gap-4' : ''}`}
                >
                  <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedPostIds.has(post.id)}
                      onCheckedChange={() => togglePost(post.id)}
                      className="w-5 h-5 bg-black/60 border-white/30 backdrop-blur-md data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                  </div>
                  <div className={`relative ${viewMode === 'grid' ? 'aspect-video' : 'w-48 h-28'} overflow-hidden flex-shrink-0 bg-[var(--bg-tertiary)]`}>
                    <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover transition-transform duration-[var(--duration-slow)] hover:scale-[1.025]" />
                  </div>
                  <div className="p-4 flex flex-col justify-center">
                    <h3 className="text-[var(--text-base)] leading-[var(--line-sm)] font-medium text-[var(--text-primary)] mb-1.5">{post.title}</h3>
                    <p className="text-[var(--text-xs)] uppercase tracking-[0.08em] font-medium text-[var(--text-tertiary)]">{post.tags.slice(0, 3).join(' • ')}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Action Bar */}
        {selectedPostIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[rgba(18,18,18,0.95)] backdrop-blur-2xl border border-[var(--border-medium)] rounded-lg px-6 py-4 shadow-[var(--shadow-overlay)]">
            <div className="flex items-center gap-6">
              <span className="text-[13px] text-[var(--text-secondary)]">
                {selectedPostIds.size} / 6 videos selected
              </span>
              <Button onClick={() => setStep('details')}>
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Details Form
  return (
    <div className="p-6 md:p-12 lg:p-16">
      <div className="mb-12">
        <Button variant="ghost" onClick={() => setStep('select-videos')} className="mb-6 -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Selection
        </Button>
        <h1 className="text-[32px] leading-[40px] font-light text-[var(--text-primary)] tracking-tight">
          Step 2: Collection Details
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mt-2">
          {selectedPostIds.size} video{selectedPostIds.size !== 1 ? 's' : ''} selected
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-md)] text-red-400 text-[13px]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-10">
        <Input
          label="Collection Name"
          placeholder="Q1 2024 Highlights"
          value={formData.title}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />

        <Input
          label="Slug"
          helperText="Auto-generated from name. Used in the URL."
          placeholder="q1-2024-highlights"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          required
          className="font-mono"
        />

        <Textarea
          label="Intro"
          helperText="Optional introductory text for the collection page."
          placeholder="A curated selection of our best work from the first quarter..."
          value={formData.intro}
          onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
          rows={3}
        />

        <Input
          label="Password (Optional)"
          type="password"
          helperText="Leave empty for public collections."
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />


        <div className="flex items-center gap-3 pt-6">
          <Button type="submit" disabled={saving || selectedPostIds.size === 0}>
            {saving ? 'Creating...' : 'Create Collection'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}