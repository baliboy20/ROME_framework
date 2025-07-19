export function reverseText(text: string): string {
  if (!text) {
    return '';
  }

  const chars = Array.from(text);
  return chars.reverse().join('');
}