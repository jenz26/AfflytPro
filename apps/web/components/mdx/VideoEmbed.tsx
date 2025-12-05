'use client';

import { useState } from 'react';
import { Play, Clock } from 'lucide-react';

interface VideoEmbedProps {
  src: string;
  title: string;
  thumbnail?: string;
  duration?: string;
}

function getYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function VideoEmbed({ src, title, thumbnail, duration }: VideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const youtubeId = getYouTubeId(src);

  // Auto-generate thumbnail if not provided and it's YouTube
  const thumbnailUrl = thumbnail || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : undefined);

  if (isPlaying && youtubeId) {
    return (
      <div className="my-8 aspect-video rounded-2xl overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className="my-8">
      <button
        onClick={() => setIsPlaying(true)}
        className="relative w-full aspect-video rounded-2xl overflow-hidden group cursor-pointer"
      >
        {/* Thumbnail */}
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-afflyt-dark-50" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-afflyt-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-afflyt-cyan-400/30">
            <Play className="h-8 w-8 text-afflyt-dark-100 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Title and duration */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-medium">{title}</p>
          {duration && (
            <div className="flex items-center gap-1 text-sm text-gray-300 mt-1">
              <Clock className="h-3 w-3" />
              {duration}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
