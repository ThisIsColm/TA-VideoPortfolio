import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from './api';
import type { GhostPost, CollectionSummary } from './api';

interface AppContextType {
  // Collections
  collections: CollectionSummary[];
  collectionsLoading: boolean;
  refreshCollections: () => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

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

  // Initial load on mount
  useEffect(() => {
    refreshCollections();
  }, [refreshCollections]);

  const deleteCollectionFn = async (id: string) => {
    await api.deleteCollection(id);
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AppContext.Provider value={{
      collections,
      collectionsLoading,
      refreshCollections,
      deleteCollection: deleteCollectionFn,
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
