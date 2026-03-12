import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router';
import { ThumbnailCard } from '../components/ghost/ThumbnailCard';
import { CaseStudyOverlay } from '../components/ghost/CaseStudyOverlay';
import { Lock } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Button } from '../components/ghost/Button';
import { Input } from '../components/ghost/Input';
import * as api from '../lib/api';
import type { GhostPost, PublicCollection } from '../lib/api';

export default function CollectionPage() {
  const { slug, postSlug } = useParams();
  const navigate = useNavigate();

  const [collection, setCollection] = useState<PublicCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Fetch collection
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.fetchPublicCollection(slug)
      .then(({ collection }) => {
        setCollection(collection);
        setError('');
      })
      .catch((err) => {
        if (err.status === 404) {
          setError('not-found');
        } else {
          setError('error');
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Deep link: auto-open overlay for postSlug OR if single video
  useEffect(() => {
    if (collection?.posts) {
      if (postSlug) {
        const idx = collection.posts.findIndex(p => p.slug === postSlug);
        if (idx >= 0) {
          setSelectedIndex(idx);
        }
      } else if (collection.posts.length === 1) {
        // Auto-open the only video
        setSelectedIndex(0);
        const post = collection.posts[0];
        window.history.replaceState(null, '', `/p/${slug}/${post.slug}`);
      }
    }
  }, [postSlug, collection, slug]);

  // Handle browser back to close overlay
  useEffect(() => {
    const handlePopState = () => {
      if (selectedIndex !== null) {
        setSelectedIndex(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-[15px] text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  if (error === 'not-found') {
    return <Navigate to="/404" replace />;
  }


  if (error === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[32px] leading-[40px] font-light text-[var(--text-primary)] mb-4 tracking-tight">
            Error
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)]">
            Something went wrong loading this collection.
          </p>
        </div>
      </div>
    );
  }

  if (!collection || !collection.posts) return null;

  const posts = collection.posts;

  if (posts.length === 1) {
    return (
      <CaseStudyOverlay
        post={posts[0]}
        currentIndex={0}
        totalCount={1}
        isStandalone={true}
      />
    );
  }

  let heroPost = posts[0];
  let heroIndex = 0;
  if (collection.heroPostId) {
    const idx = posts.findIndex(p => p.id === collection.heroPostId);
    if (idx !== -1) {
      heroPost = posts[idx];
      heroIndex = idx;
    }
  }

  const handleThumbnailClick = (index: number) => {
    setScrollPosition(window.scrollY);
    setSelectedIndex(index);
    // Update URL for deep linking
    const post = posts[index];
    if (post) {
      window.history.pushState(null, '', `/p/${slug}/${post.slug}`);
    }
  };

  const handleClose = () => {
    setSelectedIndex(null);
    // Restore URL
    window.history.pushState(null, '', `/p/${slug}`);
    // Restore scroll position
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 0);
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < posts.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      window.history.replaceState(null, '', `/p/${slug}/${posts[newIndex].slug}`);
    }
  };

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      window.history.replaceState(null, '', `/p/${slug}/${posts[newIndex].slug}`);
    }
  };

  return (
    <>
      <div className="min-h-screen">
        {/* Top Spacer / Navigation area if needed */}
        <div className="h-4 md:h-8"></div>

        {/* Hero Section Container */}
        <div className="cinematic-container relative">
          {collection.posts.length > 0 && heroPost && (
            <div className="relative w-full aspect-[21/9] md:aspect-[2.35/1] bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-medium)] group">
              {/* Background Image (Chosen hero video thumbnail) */}
              <img
                src={heroPost.thumbnail}
                alt={heroPost.title || collection.title}
                className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-[10s] ease-out"
              />

              {/* Film Grain Overlay */}
              <div
                className="absolute inset-0 z-[5] pointer-events-none opacity-[0.15] mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
              ></div>

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
              {/* Bottom Gradient for smoother title blending if needed */}
              <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black via-black/60 to-transparent"></div>

              {/* Logo Layer */}
              <div className="absolute top-6 left-8 md:top-10 md:left-16 z-20">
                <img
                  src="/Tiny_Ark_Logo_White.png"
                  alt="Tiny Ark Logo"
                  className="h-5 md:h-8 w-auto object-contain"
                />
              </div>


              {/* Title and Controls Content */}
              <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full max-w-3xl z-10">
                <h1 className="text-[40px] md:text-[64px] leading-[1.1] font-medium text-[var(--accent-primary)] mb-6 tracking-tight drop-shadow-lg">
                  {collection.title}
                </h1>

                {/* Decorative / Placeholder lines (from screenshot) or intro text */}
                {collection.intro ? (
                  <p className="text-[16px] md:text-[20px] leading-[1.6] text-[var(--text-primary)] mb-8 max-w-[600px] drop-shadow-md">
                    {collection.intro}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 mb-8 opacity-80">
                    <div className="h-4 bg-white/20 rounded-full w-full max-w-[400px]"></div>
                    <div className="h-4 bg-white/20 rounded-full w-3/4 max-w-[300px]"></div>
                    <div className="h-4 bg-white/20 rounded-full w-1/2 max-w-[200px]"></div>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  onClick={() => handleThumbnailClick(heroIndex)}
                  className="bg-[var(--accent-brand)] hover:bg-[#E56B01] text-white px-8 py-3.5 rounded-full font-medium text-[16px] flex items-center gap-3 transition-colors shadow-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Start watching
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="h-6 md:h-8"></div>


        {/* Grid */}
        <div className="cinematic-container pt-0 pb-24 md:pb-40">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map((post, index) => (
              <ThumbnailCard
                key={post.id}
                post={post}
                onClick={() => handleThumbnailClick(index)}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Case Study Overlay */}
      <AnimatePresence>
        {selectedIndex !== null && posts[selectedIndex] && (
          <CaseStudyOverlay
            post={posts[selectedIndex]}
            currentIndex={selectedIndex}
            totalCount={posts.length}
            onClose={handleClose}
            onNext={selectedIndex < posts.length - 1 ? handleNext : undefined}
            onPrevious={selectedIndex > 0 ? handlePrevious : undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
}