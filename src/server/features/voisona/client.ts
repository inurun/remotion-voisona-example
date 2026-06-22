import type { ServerEnv } from "@/server/core/env";

function trimEnvValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function unwrapQuotedValue(value: string) {
  const quote = value[0];
  return (quote === '"' || quote === "'") && value.endsWith(quote)
    ? value.slice(1, -1).trim()
    : value;
}

function normalizeEnvValue(value: string | undefined) {
  const trimmed = trimEnvValue(value);
  if (!trimmed) {
    return undefined;
  }

  const normalized = unwrapQuotedValue(trimmed);
  return normalized || undefined;
}

function getCredentials(serverEnv: ServerEnv) {
  const username = normalizeEnvValue(serverEnv.VOISONA_USERNAME);
  const password = normalizeEnvValue(serverEnv.VOISONA_PASSWORD);

  if (!username || !password) {
    throw new Error("VOISONA_USERNAME and VOISONA_PASSWORD must be set in .env.local.");
  }

  return { username, password };
}

export function getVoisonaBase(serverEnv: ServerEnv) {
  return normalizeEnvValue(serverEnv.VOISONA_BASE) ?? "http://localhost:32766/api/talk/v1";
}

export function getConfiguredVoicesPath(serverEnv: ServerEnv) {
  return normalizeEnvValue(serverEnv.VOISONA_VOICES_PATH);
}

export function getVoisonaHeaders(serverEnv: ServerEnv) {
  const { username, password } = getCredentials(serverEnv);
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
  };
}

async function readSuccessfulResponse<T>(response: Response) {
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

function getVoisonaRequestOutcome<T extends { state: string }>(result: T | null) {
  if (!result) {
    return "retry";
  }

  if (result.state === "succeeded") {
    return "success";
  }

  if (result.state === "failed") {
    return "failed";
  }

  return "retry";
}

async function fetchVoisonaRequestState<T extends { state: string }>(
  serverEnv: ServerEnv,
  endpoint: "speech-syntheses" | "text-analyses",
  uuid: string,
) {
  const response = await fetch(`${getVoisonaBase(serverEnv)}/${endpoint}/${uuid}`, {
    headers: getVoisonaHeaders(serverEnv),
    cache: "no-store",
  });

  return readSuccessfulResponse<T>(response);
}

export async function waitForVoisonaRequest<T extends { state: string }>(
  serverEnv: ServerEnv,
  endpoint: "speech-syntheses" | "text-analyses",
  uuid: string,
) {
  let attempts = 120;

  while (attempts > 0) {
    attempts -= 1;
    await new Promise((resolve) => setTimeout(resolve, 300));

    const result = await fetchVoisonaRequestState<T>(serverEnv, endpoint, uuid);
    const outcome = getVoisonaRequestOutcome(result);
    if (outcome === "success") {
      if (!result) {
        throw new Error(`VoiSona ${endpoint} succeeded without a response body`);
      }

      return result;
    }

    if (outcome === "failed") {
      throw new Error(`VoiSona ${endpoint} failed: ${JSON.stringify(result)}`);
    }
  }

  throw new Error(`VoiSona ${endpoint} timed out`);
}
