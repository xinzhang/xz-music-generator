'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, Music, RefreshCcw, Search, XCircle } from "lucide-react";
import { Input } from "../ui/input";
import TrackDetail from "./track-detail";
import { getPlayUrl } from "~/actions/generation";
import { usePlayerStore } from "~/stores/use-player-store";

export interface Track {
  id: string;
  title: string | null;
  createdAt: Date;
  instrumental: boolean;
  prompt: string | null;
  lyrics: string | null;
  describedLyrics: string | null;
  fullDescribedSong: string | null;
  thumbnailUrl: string | null;
  playUrl: string | null;
  status: string | null;
  createdByUserName: string | null;
  published: boolean;
}

export default function TrackList({tracks}:{tracks: Track[]}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [trackToRename, setTrackToRename] = useState<Track | null>(null);
  const router = useRouter();
  const setTrack = usePlayerStore((state) => state.setTrack);
  
  const handleTrackSelect = async (track: Track) => {
    if (loadingTrackId) return;
    setLoadingTrackId(track.id);
    const playUrl = await getPlayUrl(track.id);
    setLoadingTrackId(null);

    setTrack({
      id: track.id,
      title: track.title,
      url: playUrl,
      artwork: track.thumbnailUrl,
      prompt: track.prompt,
      createdByUserName: track.createdByUserName,
    });
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  }

  const failedTrack = (track: Track, title:string, description: string) => {
    return (
      <div
        key={track.id}
        className="flex cursor-not-allowed items-center gap-4 rounded-lg p-3"
      >
        <div className="bg-destructive/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md">
          <XCircle className="text-destructive h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-destructive truncate text-sm font-medium">
            {title}
          </h3>
          <p className="text-muted-foreground truncate text-xs">
            {description}
          </p>
        </div>
      </div>
    );
  }

  const filteredTracks = tracks.filter(
    (track) =>
      track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ??
      track.prompt?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-1 flex-col overflow-y-scroll">
      <div className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-10"
            />
          </div>

          <Button
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2" />
            )}
            Refresh
          </Button>          
        </div>
        
        {/* Track list */}
        <div className="space-y-2">
            {filteredTracks.length > 0 ? (
              filteredTracks.map((track) => {
                switch (track.status) {
                  case "failed":
                    return failedTrack(track, "Generation failed", "Please try creating the song again.");
                  case "no credits":
                    return failedTrack(track, "No Enough Credits", "Please purchase more credits to generate this song.");
                  case "queued":
                  case "processing":
                    return failedTrack(track, "Processing song...", "Refresh to check the status");
                  default:
                    return <TrackDetail 
                        key={track.id}
                        loadingTrackId={loadingTrackId}
                        track={track}
                        handleTrackSelect={handleTrackSelect}
                        setTrackToRename={setTrackToRename}
                      />
                }
              })
            ):(
              <div className="flex flex-col items-center justify-center pt-20 text-center">
                <Music className="text-muted-foreground h-10 w-10" />
                <h2 className="mt-4 text-lg font-semibold">No Music Yet</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {searchQuery
                    ? "No tracks match your search."
                    : "Create your first song to get started."}
                </p>
              </div>
            )}
        </div>
      </div>

      {/* {trackToRename && (
        <RenameDialog
          track={trackToRename}
          onClose={() => setTrackToRename(null)}
          onRename={(trackId, newTitle) => renameSong(trackId, newTitle)}
        />
      )} */}
    </div>
  )

}