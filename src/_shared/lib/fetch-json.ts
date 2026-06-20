export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const json = (await response.json()) as T | { error?: string };

  if (!response.ok) {
    const message = typeof json === "object" && json && "error" in json ? json.error : undefined;
    throw new Error(message ?? `HTTP ${response.status}`);
  }

  return json as T;
}
