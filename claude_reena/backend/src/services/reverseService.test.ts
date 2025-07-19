import { reverseText } from './reverseService';

describe('reverseText', () => {
  it('should reverse a simple string', () => {
    expect(reverseText('hello')).toBe('olleh');
  });

  it('should handle empty string', () => {
    expect(reverseText('')).toBe('');
  });

  it('should handle single character', () => {
    expect(reverseText('a')).toBe('a');
  });

  it('should handle string with spaces', () => {
    expect(reverseText('hello world')).toBe('dlrow olleh');
  });

  it('should handle special characters', () => {
    expect(reverseText('hello!@#$%')).toBe('%$#@!olleh');
  });

  it('should handle numbers', () => {
    expect(reverseText('12345')).toBe('54321');
  });

  it('should handle mixed alphanumeric', () => {
    expect(reverseText('abc123')).toBe('321cba');
  });

  it('should handle unicode characters properly', () => {
    expect(reverseText('hello 👋')).toBe('👋 olleh');
    expect(reverseText('🚀🌟')).toBe('🌟🚀');
  });

  it('should handle multi-byte unicode correctly', () => {
    expect(reverseText('café')).toBe('éfac');
  });

  it('should handle palindromes', () => {
    expect(reverseText('racecar')).toBe('racecar');
  });

  it('should handle maximum length string (100 chars)', () => {
    const longString = 'a'.repeat(100);
    expect(reverseText(longString)).toBe(longString);
  });
});