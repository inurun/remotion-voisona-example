import { toast } from "sonner";
import useSWR from "swr";
import { fetchVoices } from "@/app/features/voices/api/voices-api";

const voicesKeys = {
  voices: () => ["voisona", "voices"] as const,
};

export function useVoicesQuery() {
  const { data, mutate } = useSWR(voicesKeys.voices(), fetchVoices, {
    revalidateOnFocus: false,
    onError(err, key, config) {
      console.error(err, key, config);
      toast.error("Voices loading failed");
    },
  });

  return {
    options: data?.options ?? [],
    loadVoices: async () => {
      await mutate();
    },
  };
}
