import { db } from "~/server/db";
import { inngest } from "./client";
import { env } from "~/env";

type RequestBody = {
  guidance_scale?: number;
  infer_step?: number;
  audio_duration?: number;
  seed?: number;
  full_described_song?: string;
  prompt?: string;
  lyrics?: string;
  described_lyrics?: string;
  instrumental?: boolean;
};

const onFailure = async ({ event }: { event: unknown }) => {
  await db.song.update({
    where: {
      id: event?.data?.event?.data?.songId ?? '',
    },
    data: {
      status: "failed"
    }
  });
}

const findSong = async (songId: string) => {
  return await db.song.findUniqueOrThrow({
    where: {
      id: songId,
    },
    select: {
      user: {
        select: {
          id: true,
          credits: true,
        },
      },
      prompt: true,
      lyrics: true,
      fullDescribedSong: true,
      describedLyrics: true,
      instrumental: true,
      guidanceScale: true,
      inferStep: true,
      audioDuration: true,
      seed: true,
    },
  });
}

type SongType = Awaited<ReturnType<typeof findSong>>;

const getRequestBody = (song: SongType) => {
  let endpoint = "";

  let body: RequestBody = {};

  const commonParams = {
    guidance_scale: song.guidanceScale ?? undefined,
    infer_step: song.inferStep ?? undefined,
    audio_duration: song.audioDuration ?? undefined,
    seed: song.seed ?? undefined,
    instrumental: song.instrumental ?? undefined,
  }

  if (song.fullDescribedSong) {
    endpoint = env.GENERATE_FROM_DESCRIPTION;
    body = {
      ...commonParams,
      full_described_song: song.fullDescribedSong,
    }
  }
  else if (song.lyrics && song.prompt) {
    endpoint = env.GENERATE_WITH_LYRICS;
    body = {
      lyrics: song.lyrics,
      prompt: song.prompt,
      ...commonParams,
    };
  }
  else if (song.describedLyrics && song.prompt) {
    endpoint = env.GENERATE_FROM_DESCRIBED_LYRICS;
    body = {
      described_lyrics: song.describedLyrics,
      prompt: song.prompt,
      ...commonParams,
    };
  }

  return {endpoint, body}
}

const checkCredits = (songId: string) => async () => {
  const song = await findSong(songId);

  return {
    userId: song.user.id,
    credits: song.user.credits,
    ...getRequestBody(song),
  }
}

const updateSongResult = (songId: string, response: Response) => async () => {
    const responseData = response.ok
        ? ((await response.json()) as {
            s3_key: string;
            cover_image_s3_key: string;
            categories: string[];
          })
        : null;

    await db.song.update({
      where: {
        id: songId,
      },
      data: {
        s3Key: responseData?.s3_key,
        thumbnailS3Key: responseData?.cover_image_s3_key,
        status: response.ok ? "processed" : "failed",
      },
    });    

    if (responseData && responseData.categories.length > 0) {
      await db.song.update({
        where: { id: songId },
        data: {
          categories: {
            connectOrCreate: responseData.categories.map(
              (categoryName) => ({
                where: { name: categoryName },
                create: { name: categoryName },
              }),
            ),
          },
        },
      });
    }
}

const updateSongStatus = (songId:string, status:string) => async () => {
  return await db.song.update({
    where: {
      id: songId,
    },
    data: {
      status: status,
    },
  });
}

const deductCredit = (userId: string, response: Response) => async () => {
  if (!response.ok) return;

  await db.user.update({
    where: { id: userId },
    data: {
      credits: {
        decrement: 1,
      },
    },
  });
}

export const generateSong = inngest.createFunction(
  {
    id: "generate-song",
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
    onFailure: onFailure
  },
  { event: "generate-song-event" },
  async ({ event, step }) => {
    const { songId } = event?.data as { songId: string; userId: string;}

    const { userId, credits, endpoint, body } = await step.run(
      "check-credits",
      checkCredits(songId),
    )

    console.log('check-credits', body, credits)

    if (credits > 0) {
      // generate the song
      await step.run(
        "set-status-processing",        
        updateSongStatus(songId, "processing")        
      )

      console.log('before call modal', endpoint, body)

      // call MODAL to generate song
      const response = await step.fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          // "Modal-Key": env.MODAL_KEY,
          // "Modal-Secret": env.MODAL_SECRET,
        },
      });

      console.log('call modal finished')
      await step.run(
        "update-song-result",
        updateSongResult(songId, response)
      )

      await step.run(
        "deduct-credits", 
        deductCredit(userId, response)
      );

      return { message: "song is created"}

    } else {
      await step.run(
        "set-status-no-credits",        
        updateSongStatus(songId, "no credits")        
      )
      return { message: "no credit"}
    }
  },
);
