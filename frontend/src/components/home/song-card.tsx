"use client";

import type { Category, Like, Song } from "@prisma/client";
import { Heart, Loader2, Music, Pause, Play } from "lucide-react";
import { useState } from "react";
import { getPlayUrl } from "~/actions/generation";
import { toggleLikeSong } from "~/actions/song";
import Image from "next/image";

import { usePlayerStore } from "~/stores/use-player-store";

type SongWithRelation = Song & {
  user: { name: string | null };
  _count: {
    likes: number;
  };
  categories: Category[];
  thumbnailUrl?: string | null;
  likes?: Like[];
};

export function SongCard({ song }: { song: SongWithRelation }) {
  const [isLoading, setIsLoading] = useState(false);
  const { track: currentTrack, setTrack } = usePlayerStore();
  const [isLiked, setIsLiked] = useState(
    song.likes ? song.likes.length > 0 : false,
  );
  const [likesCount, setLikesCount] = useState(song._count.likes);
  
  const isCurrentTrack = currentTrack?.id === song.id;

  const handleThumbnailClick = async () => {
    if (isCurrentTrack) {
      // If this track is currently playing, stop it by clearing the track
      setTrack({ id: "", title: null, url: null, artwork: null, prompt: null, createdByUserName: null });
    } else {
      setIsLoading(true);
      const playUrl = await getPlayUrl(song.id);

      setTrack({
        id: song.id,
        title: song.title,
        url: playUrl,
        artwork: song.thumbnailUrl,
        prompt: song.prompt,
        createdByUserName: song.user.name,
      });

      setIsLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    await toggleLikeSong(song.id);
  };

  return (
    <div>
      {/* thumbnail */}
      <div 
        className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-md bg-gray-200 group-hover:opacity-75"
        onClick={handleThumbnailClick}
      >
          {song.thumbnailUrl ? (
            <Image 
              className="h-full w-full object-cover object-center"
              src={song.thumbnailUrl}
              alt={song.title ?? ''} 
              width={200}
              height={200}
              />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <Music className="text-muted-foreground h-12 w-12" />
            </div>
          )}

          {/* Play/Pause overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            isCurrentTrack 
              ? "bg-black/50 opacity-100" 
              : "bg-black/50 opacity-0 group-hover:opacity-100"
          }`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 transition-transform group-hover:scale-105">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : isCurrentTrack ? (
                <Pause className="h-6 w-6 fill-white text-white" />
              ) : (
                <Play className="h-6 w-6 fill-white text-white" />
              )}
            </div>
          </div>
        </div>

      {/* song title */}
      <div className="cursor-default">
        <h3 className="mt-2 truncate text-sm font-medium text-gray-900">
          {song.title}
        </h3>

        <p className="text-xs text-gray-500">{song.user.name}</p>

        <div className="mt-1 flex gap-2 items-center justify-between text-xs text-gray-900">
          <span>{song.listenCount} listens</span>
          <button
            onClick={handleLike}
            className="flex cursor-pointer items-center gap-1"
          >
            <Heart
              className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
            />
            {likesCount} likes
          </button>
        </div>
      </div>
    </div>
  );
}
