import React, { useState, useRef, useEffect } from 'react';
import type { GhostPost } from '../../lib/api';
import { Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ThumbnailCardProps {
  post: GhostPost;
  onClick: () => void;
  index?: number;
}

export function ThumbnailCard({ post, onClick, index = 0 }: ThumbnailCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="group relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] cursor-pointer shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-medium)] hover:border-[var(--border-active)] transition-colors duration-[var(--duration-base)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-[var(--bg-tertiary)]">
        <motion.img
          layoutId={`thumbnail-${post.id}`}
          src={post.thumbnail}
          alt={post.title}
          className="w-full h-full object-cover brightness-95 transition-all duration-[var(--duration-slow)] ease-[var(--ease-out)] group-hover:brightness-110 group-hover:scale-[1.025]"
        />

        {/* Hover Video Preview (Always rendered but hidden unless hovering to ensure instant playback) */}
        <AnimatePresence>
          {post.vimeoId && (
            <motion.div
              initial={false}
              animate={{ opacity: isHovering ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-[2] bg-black pointer-events-none"
            >
              <iframe
                src={`https://player.vimeo.com/video/${post.vimeoId}?background=1&autoplay=1&loop=1&muted=1&title=0&byline=0&portrait=0`}
                className="absolute inset-0 w-full h-full scale-[1.15]"
                allow="autoplay; fullscreen; picture-in-picture"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play icon */}
        <div className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none">
          <div className={`w-14 h-14 rounded-full bg-black/30 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all duration-[var(--duration-base)] ease-[var(--ease-spring)] shadow-[var(--shadow-glow)] ${isHovering ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
            <Play className="w-5 h-5 text-white fill-white ml-1 opacity-90" />
          </div>
        </div>

        {/* Metadata overlay directly on the image bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-[4] p-5 pt-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none transition-opacity duration-[var(--duration-base)]">
          <motion.h3
            layoutId={`title-${post.id}`}
            className="text-[var(--text-base)] leading-[var(--line-sm)] font-medium text-[var(--text-primary)] mb-1.5 drop-shadow-md"
          >
            {post.title}
          </motion.h3>
          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-[var(--accent-brand)] drop-shadow-sm">
            {post.tags.slice(0, 2).join(' • ')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
