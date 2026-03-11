import React from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../lib/AppContext';
import { Button } from '../components/ghost/Button';
import { Plus, ExternalLink, Pencil, Trash2, Link2, LayoutGrid, List, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function DashboardHome() {
  const { collections, collectionsLoading, deleteCollection } = useApp();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('dashboardViewMode') as 'grid' | 'list') || 'grid';
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('dashboardViewMode', viewMode);
  }, [viewMode]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      await deleteCollection(id);
    }
  };

  const filteredCollections = collections.filter(collection =>
    collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (collection.intro && collection.intro.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const copyLink = (slug: string, itemCount: number, firstPostSlug: string | null | undefined) => {
    const isSingle = itemCount === 1 && firstPostSlug;
    const url = isSingle
      ? `https://portfolio.tinyark.com/p/${slug}/${firstPostSlug}`
      : `https://portfolio.tinyark.com/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard', {
      duration: 2000,
      className: 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-[12px]',
    });
  };

  if (collectionsLoading) {
    return (
      <div className="p-6 md:p-12 lg:p-16">
        <div className="text-[15px] text-[var(--text-secondary)]">Loading collections...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 lg:p-16">
      {/* Header Section */}
      <div className="flex items-end justify-between mb-16 gap-6">
        <div>
          <h1 className="text-[32px] leading-[40px] font-bold text-[var(--text-primary)] mb-2 tracking-[-0.03em]">
            Tiny Ark Portfolios
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)]">
            Create and manage your curated video portfolios
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-[var(--radius-sm)] transition-colors ${viewMode === 'grid'
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-[var(--radius-sm)] transition-colors ${viewMode === 'list'
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search portfolios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 h-10 pl-10 pr-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all focus:outline-none focus:border-[var(--border-active)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button
            onClick={() => navigate('/dashboard/collections/new')}
            className="!bg-[var(--accent-brand)] !text-white hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Portfolio
          </Button>
        </div>
      </div>

      {/* Collections Area */}
      {
        collections.length === 0 ? (
          <div className="text-center py-20 bg-[var(--bg-secondary)] border border-dashed border-[var(--border-medium)] rounded-[var(--radius-xl)]">
            <p className="text-[15px] text-[var(--text-secondary)] mb-6">
              No collections yet. Create your first one.
            </p>
            <Button
              onClick={() => navigate('/dashboard/collections/new')}
              className="!bg-[var(--accent-brand)] !text-white hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Portfolio
            </Button>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-20 bg-[var(--bg-secondary)] border border-dashed border-[var(--border-medium)] rounded-[var(--radius-xl)]">
            <p className="text-[15px] text-[var(--text-secondary)] mb-6">
              No collections found matching "{searchQuery}".
            </p>
            <Button variant="secondary" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {filteredCollections.map((collection, index) => (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    key={collection.id}
                    className="group relative flex flex-col bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden hover:border-[var(--border-active)] hover:shadow-2xl hover:shadow-black/40 transition-all duration-300"
                  >
                    {/* Thumbnail Mini-Gallery */}
                    <div
                      className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                      onClick={() => {
                        const url = (collection.itemCount === 1 && collection.firstPostSlug)
                          ? `/p/${collection.slug}/${collection.firstPostSlug}`
                          : `/p/${collection.slug}`;
                        window.open(url, '_blank');
                      }}
                    >
                      {!collection.thumbnails || collection.thumbnails.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] group-hover:bg-[var(--bg-secondary)] transition-colors duration-300">
                          <div className="flex flex-col items-center gap-2">
                            <Plus className="w-6 h-6 opacity-20" />
                            <span className="text-[11px] uppercase tracking-widest font-mono opacity-40">No Videos</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`grid h-full gap-0.5 ${collection.thumbnails.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                          }`}>
                          {collection.thumbnails.slice(0, 4).map((thumb, i) => (
                            <div key={i} className={`relative overflow-hidden ${collection.thumbnails.length === 3 && i === 0 ? 'row-span-2' : ''
                              }`}>
                              <img
                                src={thumb}
                                alt=""
                                className="w-full h-full object-cover transform group-hover:scale-[1.025] transition-transform duration-700 ease-out"
                              />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Item Count Badge */}
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/90">
                        {collection.itemCount} VIDEO{collection.itemCount !== 1 ? 'S' : ''}
                      </div>

                      {/* Hover Play Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex-1 mb-6">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div
                            onClick={() => {
                              const url = (collection.itemCount === 1 && collection.firstPostSlug)
                                ? `/p/${collection.slug}/${collection.firstPostSlug}`
                                : `/p/${collection.slug}`;
                              window.open(url, '_blank');
                            }}
                            className="text-[17px] font-light text-[var(--text-primary)] group-hover:text-white hover:underline decoration-white/30 underline-offset-4 transition-colors line-clamp-1 cursor-pointer"
                          >
                            {collection.title}
                          </div>
                        </div>
                        <p className="text-[13px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed h-[40px]">
                          {collection.intro || "No description provided."}
                        </p>
                      </div>

                      {/* Share Link Area */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink(collection.slug, collection.itemCount, collection.firstPostSlug);
                        }}
                        className="mb-4 p-3 bg-black/20 border border-white/5 rounded-lg flex items-center justify-between group/link cursor-pointer hover:bg-black/30 hover:border-white/10 transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Link2 className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover/link:text-[var(--text-primary)] transition-colors" />
                          <span className="text-[11px] font-mono text-[var(--text-tertiary)] truncate group-hover/link:text-[var(--text-secondary)] transition-colors">
                            portfolio.tinyark.com/p/{collection.slug}{(collection.itemCount === 1 && collection.firstPostSlug) ? `/${collection.firstPostSlug}` : ''}
                          </span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-mono text-[var(--text-tertiary)] opacity-0 group-hover/link:opacity-100 transition-opacity">
                          Copy
                        </span>
                      </div>

                      {/* Footer / Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                        <div className="text-[10px] uppercase tracking-widest font-mono text-[var(--text-tertiary)]">
                          {format(new Date(collection.createdAt), 'd MMMM yyyy')}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/dashboard/collections/${collection.id}/edit`)}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(collection.id, collection.title)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="flex flex-col gap-3">
                {filteredCollections.map((collection, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    key={collection.id}
                    onClick={() => {
                      const url = (collection.itemCount === 1 && collection.firstPostSlug)
                        ? `/p/${collection.slug}/${collection.firstPostSlug}`
                        : `/p/${collection.slug}`;
                      window.open(url, '_blank');
                    }}
                    className="group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] hover:border-[var(--border-active)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer gap-4 md:gap-0"
                  >
                    {/* Left Side: Title & Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent-hover)] transition-colors">
                        <LayoutGrid className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[16px] font-medium text-[var(--text-primary)] group-hover:text-white transition-colors">
                            {collection.title}
                          </span>
                        </div>
                        <span className="text-[13px] text-[var(--text-secondary)] line-clamp-1 max-w-md">
                          {collection.intro || "No description provided."}
                        </span>
                      </div>
                    </div>

                    {/* Right Side: Meta & Actions */}
                    <div className="flex items-center gap-6 justify-between md:justify-end ml-14 md:ml-0">
                      <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-[12px] text-[var(--text-primary)]">{collection.itemCount} VIDEO{collection.itemCount !== 1 ? 'S' : ''}</span>
                        <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">
                          {format(new Date(collection.createdAt), 'd MMMM yyyy')}
                        </span>
                      </div>

                      {/* Share Link Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink(collection.slug, collection.itemCount, collection.firstPostSlug);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-black/20 border border-white/5 rounded-md hover:bg-black/30 hover:border-white/10 transition-all text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-mono hidden lg:inline">Copy Link</span>
                      </button>

                      <div className="flex items-center gap-1 border-l border-[var(--border-subtle)] pl-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/collections/${collection.id}/edit`);
                          }}
                          className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(collection.id, collection.title);
                          }}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )
      }
    </div >
  );
}