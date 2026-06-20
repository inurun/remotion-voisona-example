import { draftProjectSchema, savedProjectSchema } from "@/_schemas";

export const projectContract = {
  get: {
    response: savedProjectSchema,
  },
  save: {
    json: draftProjectSchema,
    response: savedProjectSchema,
  },
};
