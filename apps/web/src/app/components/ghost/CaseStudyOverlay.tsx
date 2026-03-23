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
  const [processedHtml, setProcessedHtml] = useState<string>(post.html || '');
  const [contentImages, setContentImages] = useState<string[]>([]);

  useEffect(() => {
    if (post.html) {
      const doc = new DOMParser().parseFromString(post.html, 'text/html');
      
      // Extract images for fullscreen gallery
      const imgs = Array.from(doc.querySelectorAll('img')).map(img => img.src);
      setContentImages(imgs);

      // Remove the first vimeo iframe if it's already shown in the hero section
      if (post.vimeoId) {
        const vimeoIframes = doc.querySelectorAll('iframe[src*="vimeo"]');
        if (vimeoIframes.length > 0) {
          const firstVimeo = vimeoIframes[0];
          const container = firstVimeo.closest('.kg-card') || firstVimeo.closest('figure') || firstVimeo;
          container.remove();
        }
      }

      // Apply correct aspect ratios to all remaining vimeo iframes
      const remainingIframes = doc.querySelectorAll('iframe[src*="vimeo"]');
      remainingIframes.forEach(iframe => {
        const src = iframe.getAttribute('src');
        const idMatch = src?.match(/\/video\/(\d+)/);
        if (idMatch) {
          const id = idMatch[1];
          const videoMeta = post.vimeoVideos?.find(v => v.id === id);
          if (videoMeta?.width && videoMeta?.height) {
            (iframe as HTMLElement).style.aspectRatio = `${videoMeta.width} / ${videoMeta.height}`;
            (iframe as HTMLElement).style.height = 'auto';
          } else {
            // Fallback to 16/9 if metadata is missing
            (iframe as HTMLElement).style.aspectRatio = '16 / 9';
          }
        }
      });
      
      setProcessedHtml(doc.body.innerHTML);
    } else {
      setProcessedHtml('');
    }
  }, [post.html, post.vimeoId]);
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
          className="min-h-screen pt-4 md:pt-8 pb-12 md:pb-20 px-6 md:px-20"
        >
          {/* Close Button */}
          {!isStandalone && onClose && (
            <button
              onClick={onClose}
              className="fixed top-6 right-6 md:top-10 md:right-10 z-[1001] w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[var(--border-medium)] backdrop-blur-md hidden md:flex items-center justify-center transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.15)] hover:border-[var(--border-active)] group"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
            </button>
          )}

          {/* Header Image Section */}
          <div className="w-full max-w-[1240px] mx-auto mb-0">
            <div className="relative w-full aspect-[3/4] md:aspect-[2.35/1] bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)] overflow-hidden group">
              {/* Background Image */}
              {post.thumbnail && (
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-[10s] ease-out"
                />
              )}

              {/* Film Grain Overlay */}
              <div
                className="absolute inset-0 z-[5] pointer-events-none opacity-[0.15] mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
              ></div>

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
              {/* Bottom Gradient for smoothly blending into black background */}
              <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black via-black/60 to-transparent"></div>

              {/* Logo Layer */}
              <div className="absolute top-6 left-6 md:top-10 md:left-16 z-20">
                <img
                  src="/Tiny_Ark_Logo_White.png"
                  alt="Tiny Ark Logo"
                  className="h-5 md:h-8 w-auto object-contain"
                />
              </div>

              {/* Title Section Content inside Image */}
              <div className="absolute bottom-0 left-0 p-6 md:p-16 w-full max-w-3xl z-10 flex flex-col justify-end h-full">
                <div className="max-w-[1000px]">
                  <h1 className="text-[32px] md:text-[64px] leading-[1.1] font-medium text-[var(--accent-primary)] mb-6 tracking-tight drop-shadow-lg">
                    {post.title}
                  </h1>

                  <div className="flex gap-4 md:gap-6 text-[11px] font-mono uppercase tracking-[0.08em] text-white/80 mb-6 drop-shadow-sm">
                    {post.year && <span>{post.year}</span>}
                    {post.client && <span>{post.client}</span>}
                    {post.category && <span>{post.category}</span>}
                  </div>

                  {/* Description / excerpt (moved inside header) */}
                  {post.description && (
                    <p className="text-[15px] md:text-[20px] leading-[1.6] text-[var(--text-primary)] mb-6 md:mb-8 max-w-[600px] drop-shadow-md">
                      {post.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Video Section Container (matches text content width) */}
          <div className="max-w-[1000px] mx-auto w-full mt-2 md:mt-2 relative z-20">
            {post.vimeoId && (
              <div className="mb-12 overflow-hidden bg-black">
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
          </div>

          {/* Content Container (body text) */}
          <div className="max-w-[1000px] mx-auto">
            {/* Body Content */}
            <div className="w-full mx-auto mb-16 md:mb-24">
              {/* Full Ghost HTML body */}
              {processedHtml && (
                <div
                  className="ghost-content text-[15px] leading-[24px] text-[var(--text-secondary)]"
                  dangerouslySetInnerHTML={{ __html: processedHtml }}
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
          className="fixed top-1/2 left-6 md:left-10 -translate-y-1/2 z-[1001] w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[var(--border-medium)] hidden md:flex items-center justify-center transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.15)] hover:border-[var(--border-active)] group"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
        </button>
      )}

      {onNext && (
        <button
          onClick={onNext}
          className="fixed top-1/2 right-6 md:right-10 -translate-y-1/2 z-[1001] w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[var(--border-medium)] hidden md:flex items-center justify-center transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.15)] hover:border-[var(--border-active)] group"
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

        /* Essential for allowing subsequent Vimeo embeds to show and be full width */
        .ghost-content iframe[src*="vimeo"] {
          width: 100% !important;
          height: auto !important;
          border-radius: var(--radius-md);
          margin: 2rem 0;
          border: none;
          display: block;
        }

        .ghost-content .kg-embed-card {
          margin: 2rem 0;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        /* Ghost Gallery Support */
        .ghost-content .kg-gallery-card {
          display: flex !important;
          flex-direction: column !important;
          gap: 1rem !important;
          margin: 1.7rem 0 !important;
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
        
        /* Standardized margins for top-level media blocks (1.7rem to match gallery gaps) */
        .ghost-content > img,
        .ghost-content > figure:not(.kg-gallery-card),
        .ghost-content .kg-card:not(.kg-gallery-card) {
          margin: 1.7rem 0;
        }

        /* Figure children shouldn't inherit the card margin */
        .ghost-content figure {
          margin: 0;
        }

        .ghost-content > img,
        .ghost-content figure > img,
        .ghost-content .kg-card img {
          border-radius: 0;
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
          margin-bottom: 3rem;
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
          /* Figures are handled by the top-level block margin above */
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