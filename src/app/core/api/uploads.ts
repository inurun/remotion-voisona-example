import { api } from "./client";
import { parseApiJson } from "@/_shared/lib/fetch-json";

export async function uploadImage(file: File) {
  const data = await parseApiJson<{ src: string }>(
    await api.uploads.image.$post({
      form: { file },
    }),
  );

  return data.src;
}
