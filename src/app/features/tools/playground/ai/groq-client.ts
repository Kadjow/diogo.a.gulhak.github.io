import { Injectable } from '@angular/core';
import { GROQ_URL, parseResponse, describeError } from './groq.logic';

export type FetchFn = (
  url: string,
  init: RequestInit,
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

@Injectable({ providedIn: 'root' })
export class GroqClient {
  async send(key: string, body: unknown, fetchFn: FetchFn = fetch): Promise<string> {
    const res = await fetchFn(GROQ_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(describeError(res.status));
    return parseResponse(await res.json());
  }
}
