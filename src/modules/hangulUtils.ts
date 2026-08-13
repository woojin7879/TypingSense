/**
 * 한글 음절 자모 분해 및 키스트로크 생성 유틸리티 (TypeScript)
 */
import { KeystrokeItem } from '../types';

// 한글 유니코드 기본 상수
const HANGUL_START = 0xAC00;
const HANGUL_END = 0xD7A3;

const INITIALS: readonly string[] = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const MEDIALS: readonly string[] = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const FINALS: readonly string[] = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 복합 모음/자음 타이핑 분해 (예: 'ㅘ' = 'ㅗ' + 'ㅏ', 'ㄳ' = 'ㄱ' + 'ㅅ')
const COMPOSITE_KEY_MAP: Record<string, string[]> = {
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ'],
  'ㄳ': ['ㄱ', 'ㅅ'],
  'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅀ': ['ㄹ', 'ㅎ'],
  'ㅄ': ['ㅂ', 'ㅅ']
};

/**
 * 한 글자가 한글 완성형인지 확인
 */
export function isHangul(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
}

/**
 * 한글 음절을 초성, 중성, 종성 자모로 분해
 */
export function decomposeHangul(char: string): string[] {
  if (!isHangul(char)) return [char];
  
  const code = char.charCodeAt(0) - HANGUL_START;
  const initialIndex = Math.floor(code / 588);
  const medialIndex = Math.floor((code % 588) / 28);
  const finalIndex = code % 28;

  const result: string[] = [];
  result.push(INITIALS[initialIndex]);

  const medial = MEDIALS[medialIndex];
  if (COMPOSITE_KEY_MAP[medial]) {
    result.push(...COMPOSITE_KEY_MAP[medial]);
  } else {
    result.push(medial);
  }

  if (finalIndex > 0) {
    const finalChar = FINALS[finalIndex];
    if (COMPOSITE_KEY_MAP[finalChar]) {
      result.push(...COMPOSITE_KEY_MAP[finalChar]);
    } else {
      result.push(finalChar);
    }
  }

  return result;
}

export interface DecomposedKeystroke extends KeystrokeItem {
  originalChar: string;
}

/**
 * 전체 문장을 물리적 키 입력 스트림(자모/영문/특수문자 단위)으로 분해
 */
export function decomposeTextToKeystrokes(text: string): DecomposedKeystroke[] {
  const keystrokes: DecomposedKeystroke[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (isHangul(ch)) {
      const jamos = decomposeHangul(ch);
      jamos.forEach(jamo => {
        keystrokes.push({
          char: jamo,
          originalChar: ch,
          charIndex: i
        });
      });
    } else {
      keystrokes.push({
        char: ch,
        originalChar: ch,
        charIndex: i
      });
    }
  }
  return keystrokes;
}
