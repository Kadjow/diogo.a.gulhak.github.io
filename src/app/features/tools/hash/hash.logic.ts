export type HashAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const HASH_ALGOS: HashAlgo[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

export async function digestHex(
  algo: HashAlgo,
  text: string,
  subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle,
): Promise<string> {
  if (text === '') return '';
  if (!subtle) throw new Error('WebCrypto SubtleCrypto unavailable');
  const bytes = new TextEncoder().encode(text);
  const buf = await subtle.digest(algo, bytes);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
