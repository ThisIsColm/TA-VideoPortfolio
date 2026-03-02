import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from './api';
import type { GhostPost, CollectionSummary } from './api';

interface AppContextType {
  // Collections
  collections: CollectionSummary[];
  collectionsLoading: boolean;
  refreshCollections: () => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;

  // Ghost Posts
  ghostPosts: GhostPost[];
  postsLoading: boolean;
  refreshPosts: () => Promise<void>;
  searchPosts: (query: string) => GhostPost[];
  filterPostsByTag: (tag: string) => GhostPost[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [ghostPosts, setGhostPosts] = useState<GhostPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Load collections
  const refreshCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const { collections } = await api.fetchCollections();
      setCollections(collections);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  // Load ghost posts
  const refreshPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const { posts } = await api.fetchGhostPosts();
      setGhostPosts(posts);
    } catch (err) {
      console.error('Failed to load Ghost posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    refreshCollections();
    refreshPosts();
  }, [refreshCollections, refreshPosts]);

  const deleteCollectionFn = async (id: string) => {
    await api.deleteCollection(id);
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const searchPosts = (query: string) => {
    const q = query.toLowerCase();
    return ghostPosts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  };

  const filterPostsByTag = (tag: string) => {
    if (!tag) return ghostPosts;
    return ghostPosts.filter(p => p.tags.includes(tag));
  };

  return (
    <AppContext.Provider value={{
      collections,
      collectionsLoading,
      refreshCollections,
      deleteCollection: deleteCollectionFn,
      ghostPosts,
      postsLoading,
      refreshPosts,
      searchPosts,
      filterPostsByTag,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
