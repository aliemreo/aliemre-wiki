/* Resolves on success, rejects on refusal — and on silence, since writeText
   can hang when the document is not focused. */
export function clipboard(text: string): Promise<void> {
  if (!navigator.clipboard || !navigator.clipboard.writeText) return Promise.reject(new Error('no clipboard'));
  return Promise.race([
    navigator.clipboard.writeText(text),
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timed out')), 1200)),
  ]);
}
