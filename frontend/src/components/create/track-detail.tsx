"use client";

import { Download, Loader2, MoreHorizontal, Music, Pencil, Play, Trash2 } from "lucide-react";
import Image from "next/image";
import type { Track } from "./track-list";
import { Button } from "../ui/button";
import { setPublishedStatus } from "~/actions/song";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { deleteSong, getPlayUrl } from "~/actions/generation";
import { Badge } from "../ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { useState } from "react";

export type TrackDetailProps = {
  loadingTrackId: string | null, 
  track: Track,
  handleTrackSelect: (track: Track) => Promise<void>,
  setTrackToRename: (track: Track | null) => void,
}

export default function TrackDetail(
  { loadingTrackId, track, handleTrackSelect, setTrackToRename }: TrackDetailProps) {
  
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSong(track.id);
    } catch (error) {
      console.error("Failed to delete song:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      key={track.id}
      className="hover:bg-muted/50 flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors"
      onClick={() => handleTrackSelect(track)}
    >
      {/* Thumbnail */}
      <div className="group relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
        {track.thumbnailUrl ? (
          <Image
            className="h-full w-full object-cover"
            src={track.thumbnailUrl}
            alt={track.title ?? ''}
            width={48}
            height={48}
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <Music className="text-muted-foreground h-6 w-6" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          {loadingTrackId === track.id ? (
            <Loader2 className="animate-spin text-white" />
          ) : (
            <Play className="fill-white text-white" />
          )}
        </div>
      </div>

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium">{track.title}</h3>
          {track.instrumental && <Badge variant="outline">Instrumental</Badge>}
        </div>
        <p className="text-muted-foreground truncate text-xs">{track.prompt}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={async (e) => {
            e.stopPropagation();
            await setPublishedStatus(track.id, !track.published);
          }}
          variant="outline"
          size="sm"
          className={`cursor-pointer ${track.published ? "border-red-200" : ""}`}
        >
          {track.published ? "Unpublish" : "Publish"}
        </Button>
         
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={async (e) => {
                e.stopPropagation();
                const playUrl = await getPlayUrl(track.id);
                window.open(playUrl, "_blank");
              }}
              className="cursor-pointer"
            >
              <Download className="mr-2" /> Download
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async (e) => {
                e.stopPropagation();
                setTrackToRename(track);
              }}
              className="cursor-pointer"
            >
              <Pencil className="mr-2" /> Rename
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onClick={(e) => e.stopPropagation()}
                  onSelect={(e) => e.preventDefault()}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2" /> Remove
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Song</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{track.title}&quot;? This action cannot be undone and will permanently remove the song from your library and storage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
