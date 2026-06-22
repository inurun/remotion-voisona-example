import useSWR from "swr";
import { type VoiceOption } from "@/_schemas";
import { fetchVoices, voisonaKeys } from "@/app/core/api/voisona";
import { toast } from "sonner";

export type VoicesContextValue = {
  options: VoiceOption[];
  loadVoices: () => Promise<void>;
};

function useVoicesQuery() {
  const { data, mutate } = useSWR(voisonaKeys.voices(), fetchVoices, {
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

export function useVoicesProviderValue(): VoicesContextValue {
  return useVoicesQuery();
}
