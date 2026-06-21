import useSWR from "swr";
import { type VoiceOption } from "@/_schemas";
import { fetchJson } from "@/_shared/lib/fetch-json";
import { toast } from "sonner";

export type VoicesContextValue = {
  options: VoiceOption[];
  loadVoices: () => Promise<void>;
};

function useVoicesQuery() {
  const { data, mutate } = useSWR<{ options: VoiceOption[] }>("/api/voisona/voices", fetchJson, {
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
