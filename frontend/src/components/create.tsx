'use client'

import { queueSongTemp } from "~/actions/generation";
import { Button } from "./ui/button"

export default function CreateSong() {
  return <Button onClick={queueSongTemp}>Create</Button>
}