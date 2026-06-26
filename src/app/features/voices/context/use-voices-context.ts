import { type VoiceOption } from "@/_schemas";
import { useVoicesQuery } from "@/app/features/voices/swr/use-voices-query";

export type VoicesContextValue = {
  options: VoiceOption[];
  loadVoices: () => Promise<void>;
};

export function useVoicesProviderValue(): VoicesContextValue {
  return useVoicesQuery();
}
