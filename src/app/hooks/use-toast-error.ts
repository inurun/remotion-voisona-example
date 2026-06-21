import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useToastError(error: string | null, id: string) {
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!error) {
      lastErrorRef.current = null;
      return;
    }

    if (lastErrorRef.current === error) {
      return;
    }

    lastErrorRef.current = error;
    toast.error(error, { id });
  }, [error, id]);
}
