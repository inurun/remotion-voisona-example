import { z } from "zod";

export const voiceOptionSchema = z.object({
  voiceName: z.string().min(1),
  voiceVersion: z.string().optional(),
  displayName: z.string().min(1),
});

export const draftItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  readText: z.string().optional(),
  voiceName: z.string().optional(),
  voiceVersion: z.string().optional(),
  speech: z
    .object({
      analyzedText: z.string().optional(),
    })
    .optional(),
});

export const savedItemSchema = draftItemSchema.extend({
  readText: z.string().min(1),
  voiceName: z.string().min(1),
  durationSec: z.number().nonnegative(),
  audio: z.object({
    src: z.string(),
  }),
  speech: z.object({
    analyzedText: z.string().optional(),
  }),
});

export const timelineItemSchema = z
  .object({
    id: z.string().min(1),
    startSec: z.number().nonnegative(),
    endSec: z.number().nonnegative(),
  })
  .refine((value) => value.endSec >= value.startSec, {
    message: "endSec must be greater than or equal to startSec",
    path: ["endSec"],
  });

export const draftProjectSchema = z.object({
  items: z.array(draftItemSchema),
});

export const savedProjectSchema = z.object({
  items: z.array(savedItemSchema),
  timeline: z.array(timelineItemSchema),
  durationSec: z.number().nonnegative(),
});

export type VoiceOption = z.infer<typeof voiceOptionSchema>;
export type DraftItem = z.infer<typeof draftItemSchema>;
export type SavedItem = z.infer<typeof savedItemSchema>;
export type DraftProject = z.infer<typeof draftProjectSchema>;
export type SavedProject = z.infer<typeof savedProjectSchema>;
