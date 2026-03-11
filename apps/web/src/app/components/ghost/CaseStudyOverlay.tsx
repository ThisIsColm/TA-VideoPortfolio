import React, { useEffect, useState } from 'react';
import type { GhostPost } from '../../lib/api';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CaseStudyOverlayProps {
  post: GhostPost;
  currentIndex: number;
  totalCount: number;
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  isStandalone?: boolean;
}

export function CaseStudyOverlay({
  post,
  currentIndex,
  totalCount,
  onClose,
  onNext,
  onPrevious,
  isStandalone = false,
}: CaseStudyOverlayProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [contentImages, setContentImages] = useState<string[]>([]);

  useEffect(() => {
    if (post.html) {
      const doc = new DOMParser().parseFromString(post.html, 'text/html');
      const imgs = Array.from(doc.querySelectorAll('img')).map(img => img.src);
      setContentImages(imgs);
    }
  }, [post.html]);
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreenImage) {
          setFullscreenImage(null);
        } else if (!isStandalone && onClose) {
          onClose();
        }
      }
    };

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (fullscreenImage) {
        if (e.key === 'ArrowRight') {
          handleNextFullscreenImage();
        } else if (e.key === 'ArrowLeft') {
          handlePrevFullscreenImage();
        }
        return;
      }

      if (e.key === 'ArrowRight' && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious();
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleArrowKeys);

    // Prevent body scroll
    if (!isStandalone) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('keydown', handleArrowKeys);
      if (!isStandalone) {
        document.body.style.overflow = '';
      }
    };
  }, [onClose, onNext, onPrevious, fullscreenImage, contentImages, isStandalone]);

  const handlePrevFullscreenImage = () => {
    if (!fullscreenImage || contentImages.length <= 1) return;
    const currentIndex = contentImages.indexOf(fullscreenImage);
    const prevIndex = (currentIndex - 1 + contentImages.length) % contentImages.length;
    setFullscreenImage(contentImages[prevIndex]);
  };

  const handleNextFullscreenImage = () => {
    if (!fullscreenImage || contentImages.length <= 1) return;
    const currentIndex = contentImages.indexOf(fullscreenImage);
    const nextIndex = (currentIndex + 1) % contentImages.length;
    setFullscreenImage(contentImages[nextIndex]);
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const src = (target as HTMLImageElement).src;
      if (src) {
        setFullscreenImage(src);
      }
    }
  };

  return (
    <>
      <motion.div
        initial={isStandalone ? {} : { opacity: 0 }}
        animate={isStandalone ? {} : { opacity: 1 }}
        exit={isStandalone ? {} : { opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={isStandalone ? "w-full bg-[var(--bg-primary)] relative" : "fixed inset-0 z-[1000] bg-[var(--bg-primary)] overflow-y-auto"}
        onClick={(e) => {
          if (!isStandalone && e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen py-12 md:py-20 px-6 md:px-20"
        >
          {/* Close Button */}
          {!isStandalone && onClose && (
            <button
              onClick={onClose}
              className="fixed top-6 right-6 md:top-10 md:right-10 z-[1001] w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[var(--border-medium)] backdrop-blur-md flex items-center justify-center transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.15)] hover:border-[var(--border-active)] group"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
            </button>
          )}

          {/* Progress Indicator */}
          {!isStandalone && (
            <div className="fixed top-6 md:top-10 left-1/2 -translate-x-1/2 z-[1001] text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              {currentIndex + 1} of {totalCount}
            </div>
          )}

          {/* Content Container */}
          <div className="max-w-[1000px] mx-auto">
            {/* Title Section */}
            <div className="mb-8 md:mb-12">
              <h1 className="text-[24px] md:text-[40px] leading-[32px] md:leading-[48px] font-light text-[var(--text-primary)] mb-4 tracking-tight">
                {post.title}
              </h1>
              <div className="flex gap-6 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-6 md:mb-8">
                {post.year && <span>{post.year}</span>}
                {post.client && <span>{post.client}</span>}
                {post.category && <span>{post.category}</span>}
              </div>

              {/* Description / excerpt (moved above video) */}
              {post.description && (
                <p className="text-[18px] md:text-[20px] leading-[1.6] text-[var(--text-secondary)] font-light italic max-w-[800px]">
                  {post.description}
                </p>
              )}
            </div>

            {/* Video Section */}
            {post.vimeoId && (
              <div className="mb-12 md:mb-20 rounded-[var(--radius-md)] overflow-hidden bg-black">
                <div
                  className="relative w-full"
                  style={{
                    paddingBottom: post.vimeoWidth && post.vimeoHeight
                      ? `${(post.vimeoHeight / post.vimeoWidth) * 100}%`
                      : '56.25%'
                  }}
                >
                  <iframe
                    src={`https://player.vimeo.com/video/${post.vimeoId}?title=0&byline=0&portrait=0`}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Body Content */}
            <div className="w-full mx-auto mb-16 md:mb-24">
              {/* Full Ghost HTML body */}
              {post.html && (
                <div
                  className="ghost-content text-[15px] leading-[24px] text-[var(--text-secondary)]"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                  onClick={handleContentClick}
                />
              )}
            </div>

            {/* Bottom Spacing */}
            <div className="h-20 md:h-32" />
          </div>
        </motion.div>
      </motion.div>

      {/* Navigation Arrows */}
      {onPrevious && (
        <button
          onClick={onPrevious}
          className="fixed top-1/2 left-6 md:left-10 -translate-y-1/2 z-[1001] w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[var(--border-medium)] flex items-center justify-center transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.15)] hover:border-[var(--border-active)] group"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
        </button>
      )}

      {onNext && (
        <button
          onClick={onNext}
          className="fixed top-1/2 right-6 md:right-10 -translate-y-1/2 z-[1001] w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[var(--border-medium)] flex items-center justify-center transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.15)] hover:border-[var(--border-active)] group"
        >
          <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
        </button>
      )}

      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[2000] bg-[rgba(0,0,0,0.96)] flex items-center justify-center p-6"
          >
            <div
              className="absolute inset-0 cursor-zoom-out"
              onClick={() => setFullscreenImage(null)}
            />

            <motion.img
              key={fullscreenImage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              src={fullscreenImage}
              alt="Fullscreen"
              className="relative z-10 max-w-[90vw] max-h-[90vh] object-contain pointer-events-none"
            />

            {contentImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevFullscreenImage(); }}
                  className="fixed top-1/2 left-6 md:left-10 -translate-y-1/2 z-[2001] w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] flex items-center justify-center transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)] group"
                >
                  <ChevronLeft className="w-6 h-6 text-white/70 group-hover:text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextFullscreenImage(); }}
                  className="fixed top-1/2 right-6 md:right-10 -translate-y-1/2 z-[2001] w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] flex items-center justify-center transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)] group"
                >
                  <ChevronRight className="w-6 h-6 text-white/70 group-hover:text-white" />
                </button>
              </>
            )}

            <button
              onClick={() => setFullscreenImage(null)}
              className="fixed top-6 right-6 z-[2001] w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] flex items-center justify-center transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)] group"
            >
              <X className="w-6 h-6 text-white/70 group-hover:text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Premium Editorial Typography for Ghost */
        .ghost-content {
          font-size: 1.125rem; /* 18px */
          line-height: 1.8;
          color: var(--text-secondary);
        }
        
        .ghost-content img {
          cursor: zoom-in;
        }

        /* First paragraph drop cap (optional, adds to editorial feel) */
        .ghost-content > p:first-of-type::first-letter {
          float: left;
          font-size: 4.5rem;
          line-height: 0.8;
          padding-top: 0.2rem;
          padding-right: 0.5rem;
          padding-left: 0;
          color: var(--text-primary);
          font-weight: 300;
        }

        /* Remove secondary Vimeo embeds from text */
        .ghost-content iframe[src*="vimeo"] {
          display: none !important;
        }

        /* Ghost Gallery Support */
        .ghost-content .kg-gallery-card {
          display: flex !important;
          flex-direction: column !important;
          gap: 1rem !important;
          margin: 1.5rem 0 !important;
          width: 100% !important;
        }
        .ghost-content .kg-gallery-container {
          display: flex !important;
          flex-direction: column !important;
          gap: 1.5rem !important;
          width: 100% !important;
        }
        .ghost-content .kg-gallery-row {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          gap: 1.5rem !important;
          width: 100% !important;
        }
        .ghost-content .kg-gallery-image {
          flex: 1 1 0% !important;
          width: calc(50% - 0.75rem) !important;
          margin: 0 !important;
        }
        .ghost-content .kg-gallery-image img {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          margin: 0 !important;
        }
        
        .ghost-content > img,
        .ghost-content figure > img,
        .ghost-content .kg-card:not(.kg-gallery-card) img {
          border-radius: var(--radius-lg);
          margin: 1.5rem 0;
          box-shadow: var(--shadow-medium);
          width: 100%;
          cursor: zoom-in;
        }
        .ghost-content a {
          color: var(--text-primary);
          text-decoration: underline;
          text-decoration-color: var(--border-medium);
          text-underline-offset: 4px;
          transition: all var(--duration-fast);
        }
        .ghost-content a:hover {
          text-decoration-color: var(--text-primary);
          background-color: var(--accent-hover);
        }

        .ghost-content h2 {
          color: var(--text-primary);
          font-size: 1.875rem; /* 30px */
          font-weight: 400;
          letter-spacing: -0.02em;
          margin-top: 3.5rem;
          margin-bottom: 1.5rem;
        }
        
        .ghost-content h3 {
          color: var(--text-primary);
          font-size: 1.5rem;
          font-weight: 500;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }
        
        .ghost-content p {
          margin-bottom: 1.5rem;
        }
        
        .ghost-content blockquote {
          border-left: 2px solid var(--border-active);
          padding-left: 1.5rem;
          margin: 2.5rem 0;
          font-size: 1.35rem;
          font-style: italic;
          color: var(--text-primary);
          opacity: 0.9;
        }
        
        .ghost-content ul, .ghost-content ol {
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        .ghost-content li {
          margin-bottom: 0.5rem;
        }

        .ghost-content figure {
          margin: 1.5rem 0;
        }
        .ghost-content figcaption {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          text-align: center;
          margin-top: 1rem;
          font-family: monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </>
  );
}