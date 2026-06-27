import { z } from "zod";

export const voiceOptionSchema = z.object({
  voiceName: z.string().min(1),
  voiceVersion: z.string().optional(),
  displayName: z.string().min(1),
});

export const draftTtsSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  readText: z.string().optional(),
  voiceName: z.string().optional(),
  voiceVersion: z.string().optional(),
  speech: z
    .object({
      analyzedText: z.string().optional(),
    })
    .optional(),
});

export const savedTtsSchema = draftTtsSchema.extend({
  durationSec: z.number().nonnegative(),
  audio: z.object({
    src: z.string(),
  }),
  speech: z
    .object({
      analyzedText: z.string().optional(),
    })
    .default({}),
});

export const pageTypeSchema = z.enum(["intro", "main", "outro"]);

export const draftPageSchema = z.object({
  id: z.string().min(1),
  type: pageTypeSchema,
  padBeforeSec: z.number().nonnegative(),
  padAfterSec: z.number().nonnegative(),
  richText: z.string(),
  tts: z.array(draftTtsSchema),
});

export const draftProjectSchema = z.object({
  pages: z.array(draftPageSchema),
});

export const savedPageSchema = z.object({
  id: z.string().min(1),
  type: pageTypeSchema,
  padBeforeSec: z.number().nonnegative(),
  padAfterSec: z.number().nonnegative(),
  durationSec: z.number().nonnegative(),
  richText: z.string(),
  tts: z.array(savedTtsSchema),
});

export const savedProjectSchema = z.object({
  pages: z.array(savedPageSchema),
});

export const createProjectRequestSchema = z.object({
  projectPath: z.string().min(1),
});

export const copyProjectRequestSchema = z.object({
  sourceProjectPath: z.string().min(1),
  targetProjectPath: z.string().min(1),
});

export const projectFileSummarySchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1),
  segments: z.array(z.string().min(1)),
  updatedAt: z.number().int().nonnegative(),
});

export type VoiceOption = z.infer<typeof voiceOptionSchema>;
export type DraftTts = z.infer<typeof draftTtsSchema>;
export type SavedTts = z.infer<typeof savedTtsSchema>;
export type PageType = z.infer<typeof pageTypeSchema>;
export type DraftPage = z.infer<typeof draftPageSchema>;
export type SavedPage = z.infer<typeof savedPageSchema>;
export type DraftProject = z.infer<typeof draftProjectSchema>;
export type SavedProject = z.infer<typeof savedProjectSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export type CopyProjectRequest = z.infer<typeof copyProjectRequestSchema>;
export type ProjectFileSummary = z.infer<typeof projectFileSummarySchema>;
