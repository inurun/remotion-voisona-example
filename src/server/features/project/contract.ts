import { draftProjectSchema, projectFileSummarySchema, savedProjectSchema } from "@/_schemas";

export const projectContract = {
  list: {
    response: projectFileSummarySchema.array(),
  },
  get: {
    response: savedProjectSchema,
  },
  save: {
    json: draftProjectSchema,
    response: savedProjectSchema,
  },
};
