const jsonCache = new Map<string, Promise<unknown>>();

export async function fetchJson<T>(path: string): Promise<T> {
  if (!jsonCache.has(path)) {
    const request = fetch(path).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch ${path}: ${res.status}`);
      }

      return res.json() as Promise<T>;
    }).catch((error) => {
      jsonCache.delete(path);
      throw error;
    });

    jsonCache.set(path, request);
  }

  return jsonCache.get(path) as Promise<T>;
}
