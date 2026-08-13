/**
 * 키보드 레이아웃 및 10손가락 매핑 정의 (TypeScript)
 */
import { FingerConfig, FingerId, KeyDefinition, KeyMappingInfo } from '../types';

// 표준 10손가락 정의 및 테마 색상 (모던 파스텔 계열)
export const FINGERS: Record<FingerId, FingerConfig> = {
  L_PINKY: { id: 'L_PINKY', hand: 'Left', name: '왼손 새끼', enName: 'Left Pinky', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)' },
  L_RING: { id: 'L_RING', hand: 'Left', name: '왼손 약지', enName: 'Left Ring', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
  L_MIDDLE: { id: 'L_MIDDLE', hand: 'Left', name: '왼손 중지', enName: 'Left Middle', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)' },
  L_INDEX: { id: 'L_INDEX', hand: 'Left', name: '왼손 검지', enName: 'Left Index', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
  THUMB: { id: 'THUMB', hand: 'Both', name: '엄지 (양손)', enName: 'Thumbs', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)' },
  R_INDEX: { id: 'R_INDEX', hand: 'Right', name: '오른손 검지', enName: 'Right Index', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)' },
  R_MIDDLE: { id: 'R_MIDDLE', hand: 'Right', name: '오른손 중지', enName: 'Right Middle', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)' },
  R_RING: { id: 'R_RING', hand: 'Right', name: '오른손 약지', enName: 'Right Ring', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)' },
  R_PINKY: { id: 'R_PINKY', hand: 'Right', name: '오른손 새끼', enName: 'Right Pinky', color: '#d946ef', bg: 'rgba(217, 70, 239, 0.15)', border: 'rgba(217, 70, 239, 0.4)' },
};

// 키보드 레이아웃 정의 (Mac & Windows 대응)
export const KEYBOARD_ROWS: KeyDefinition[][] = [
  // 1열 (숫자열)
  [
    { code: 'Backquote', en: '`', enShift: '~', ko: '`', koShift: '~', finger: 'L_PINKY', width: 1 },
    { code: 'Digit1', en: '1', enShift: '!', ko: '1', koShift: '!', finger: 'L_PINKY', width: 1 },
    { code: 'Digit2', en: '2', enShift: '@', ko: '2', koShift: '@', finger: 'L_RING', width: 1 },
    { code: 'Digit3', en: '3', enShift: '#', ko: '3', koShift: '#', finger: 'L_MIDDLE', width: 1 },
    { code: 'Digit4', en: '4', enShift: '$', ko: '4', koShift: '$', finger: 'L_INDEX', width: 1 },
    { code: 'Digit5', en: '5', enShift: '%', ko: '5', koShift: '%', finger: 'L_INDEX', width: 1 },
    { code: 'Digit6', en: '6', enShift: '^', ko: '6', koShift: '^', finger: 'R_INDEX', width: 1 },
    { code: 'Digit7', en: '7', enShift: '&', ko: '7', koShift: '&', finger: 'R_INDEX', width: 1 },
    { code: 'Digit8', en: '8', enShift: '*', ko: '8', koShift: '*', finger: 'R_MIDDLE', width: 1 },
    { code: 'Digit9', en: '9', enShift: '(', ko: '9', koShift: '(', finger: 'R_RING', width: 1 },
    { code: 'Digit0', en: '0', enShift: ')', ko: '0', koShift: ')', finger: 'R_PINKY', width: 1 },
    { code: 'Minus', en: '-', enShift: '_', ko: '-', koShift: '_', finger: 'R_PINKY', width: 1 },
    { code: 'Equal', en: '=', enShift: '+', ko: '=', koShift: '+', finger: 'R_PINKY', width: 1 },
    { code: 'Backspace', en: 'Backspace', ko: 'Backspace', finger: 'R_PINKY', width: 1.6, special: true }
  ],
  // 2열 (QWERTY 상단열)
  [
    { code: 'Tab', en: 'Tab', ko: 'Tab', finger: 'L_PINKY', width: 1.4, special: true },
    { code: 'KeyQ', en: 'q', enShift: 'Q', ko: 'ㅂ', koShift: 'ㅃ', finger: 'L_PINKY', width: 1 },
    { code: 'KeyW', en: 'w', enShift: 'W', ko: 'ㅈ', koShift: 'ㅉ', finger: 'L_RING', width: 1 },
    { code: 'KeyE', en: 'e', enShift: 'E', ko: 'ㄷ', koShift: 'ㄸ', finger: 'L_MIDDLE', width: 1 },
    { code: 'KeyR', en: 'r', enShift: 'R', ko: 'ㄱ', koShift: 'ㄲ', finger: 'L_INDEX', width: 1 },
    { code: 'KeyT', en: 't', enShift: 'T', ko: 'ㅅ', koShift: 'ㅆ', finger: 'L_INDEX', width: 1 },
    { code: 'KeyY', en: 'y', enShift: 'Y', ko: 'ㅛ', koShift: 'ㅛ', finger: 'R_INDEX', width: 1 },
    { code: 'KeyU', en: 'u', enShift: 'U', ko: 'ㅕ', koShift: 'ㅕ', finger: 'R_INDEX', width: 1 },
    { code: 'KeyI', en: 'i', enShift: 'I', ko: 'ㅑ', koShift: 'ㅑ', finger: 'R_MIDDLE', width: 1 },
    { code: 'KeyO', en: 'o', enShift: 'O', ko: 'ㅐ', koShift: 'ㅒ', finger: 'R_RING', width: 1 },
    { code: 'KeyP', en: 'p', enShift: 'P', ko: 'ㅔ', koShift: 'ㅖ', finger: 'R_PINKY', width: 1 },
    { code: 'BracketLeft', en: '[', enShift: '{', ko: '[', koShift: '{', finger: 'R_PINKY', width: 1 },
    { code: 'BracketRight', en: ']', enShift: '}', ko: ']', koShift: '}', finger: 'R_PINKY', width: 1 },
    { code: 'Backslash', en: '\\', enShift: '|', ko: '₩', koShift: '|', finger: 'R_PINKY', width: 1.2 }
  ],
  // 3열 (Home Row 기준자리)
  [
    { code: 'CapsLock', en: 'Caps Lock', ko: 'Caps Lock', finger: 'L_PINKY', width: 1.8, special: true },
    { code: 'KeyA', en: 'a', enShift: 'A', ko: 'ㅁ', koShift: 'ㅁ', finger: 'L_PINKY', width: 1, home: true },
    { code: 'KeyS', en: 's', enShift: 'S', ko: 'ㄴ', koShift: 'ㄴ', finger: 'L_RING', width: 1, home: true },
    { code: 'KeyD', en: 'd', enShift: 'D', ko: 'ㅇ', koShift: 'ㅇ', finger: 'L_MIDDLE', width: 1, home: true },
    { code: 'KeyF', en: 'f', enShift: 'F', ko: 'ㄹ', koShift: 'ㄹ', finger: 'L_INDEX', width: 1, home: true, bump: true },
    { code: 'KeyG', en: 'g', enShift: 'G', ko: 'ㅎ', koShift: 'ㅎ', finger: 'L_INDEX', width: 1 },
    { code: 'KeyH', en: 'h', enShift: 'H', ko: 'ㅗ', koShift: 'ㅗ', finger: 'R_INDEX', width: 1 },
    { code: 'KeyJ', en: 'j', enShift: 'J', ko: 'ㅓ', koShift: 'ㅓ', finger: 'R_INDEX', width: 1, home: true, bump: true },
    { code: 'KeyK', en: 'k', enShift: 'K', ko: 'ㅏ', koShift: 'ㅏ', finger: 'R_MIDDLE', width: 1, home: true },
    { code: 'KeyL', en: 'l', enShift: 'L', ko: 'ㅣ', koShift: 'ㅣ', finger: 'R_RING', width: 1, home: true },
    { code: 'Semicolon', en: ';', enShift: ':', ko: ';', koShift: ':', finger: 'R_PINKY', width: 1, home: true },
    { code: 'Quote', en: "'", enShift: '"', ko: "'", koShift: '"', finger: 'R_PINKY', width: 1 },
    { code: 'Enter', en: 'Enter', ko: 'Enter', finger: 'R_PINKY', width: 1.8, special: true }
  ],
  // 4열 (하단열)
  [
    { code: 'ShiftLeft', en: 'Shift', ko: 'Shift', finger: 'L_PINKY', width: 2.3, special: true },
    { code: 'KeyZ', en: 'z', enShift: 'Z', ko: 'ㅋ', koShift: 'ㅋ', finger: 'L_PINKY', width: 1 },
    { code: 'KeyX', en: 'x', enShift: 'X', ko: 'ㅌ', koShift: 'ㅌ', finger: 'L_RING', width: 1 },
    { code: 'KeyC', en: 'c', enShift: 'C', ko: 'ㅊ', koShift: 'ㅊ', finger: 'L_MIDDLE', width: 1 },
    { code: 'KeyV', en: 'v', enShift: 'V', ko: 'ㅍ', koShift: 'ㅍ', finger: 'L_INDEX', width: 1 },
    { code: 'KeyB', en: 'b', enShift: 'B', ko: 'ㅠ', koShift: 'ㅠ', finger: 'L_INDEX', width: 1 },
    { code: 'KeyN', en: 'n', enShift: 'N', ko: 'ㅜ', koShift: 'ㅜ', finger: 'R_INDEX', width: 1 },
    { code: 'KeyM', en: 'm', enShift: 'M', ko: 'ㅡ', koShift: 'ㅡ', finger: 'R_INDEX', width: 1 },
    { code: 'Comma', en: ',', enShift: '<', ko: ',', koShift: '<', finger: 'R_MIDDLE', width: 1 },
    { code: 'Period', en: '.', enShift: '>', ko: '.', koShift: '>', finger: 'R_RING', width: 1 },
    { code: 'Slash', en: '/', enShift: '?', ko: '/', koShift: '?', finger: 'R_PINKY', width: 1 },
    { code: 'ShiftRight', en: 'Shift', ko: 'Shift', finger: 'R_PINKY', width: 2.3, special: true }
  ],
  // 5열 (스페이스바 및 하단 기능열)
  [
    { code: 'ControlLeft', mac: 'control', win: 'Ctrl', finger: 'L_PINKY', width: 1.25, special: true },
    { code: 'AltLeft', mac: 'option', win: 'Win', finger: 'L_PINKY', width: 1.25, special: true },
    { code: 'MetaLeft', mac: 'command', win: 'Alt', finger: 'L_PINKY', width: 1.25, special: true },
    { code: 'Space', en: 'Space', ko: '스페이스', finger: 'THUMB', width: 6.2, isSpace: true },
    { code: 'MetaRight', mac: 'command', win: '한/영', finger: 'R_PINKY', width: 1.25, special: true },
    { code: 'AltRight', mac: 'option', win: 'Alt', finger: 'R_PINKY', width: 1.25, special: true },
    { code: 'ControlRight', mac: 'control', win: 'Ctrl', finger: 'R_PINKY', width: 1.25, special: true }
  ]
];

// 글자(문자) -> 담당 물리 키코드 및 담당 손가락 매핑 맵
export const CHAR_TO_FINGER_MAP: Record<string, KeyMappingInfo> = {};
export const CODE_TO_FINGER_MAP: Record<string, FingerId> = {};

KEYBOARD_ROWS.forEach(row => {
  row.forEach(k => {
    CODE_TO_FINGER_MAP[k.code] = k.finger;
    if (k.en) CHAR_TO_FINGER_MAP[k.en] = { code: k.code, finger: k.finger, shift: false };
    if (k.enShift) CHAR_TO_FINGER_MAP[k.enShift] = { code: k.code, finger: k.finger, shift: true };
    if (k.ko) CHAR_TO_FINGER_MAP[k.ko] = { code: k.code, finger: k.finger, shift: false };
    if (k.koShift) CHAR_TO_FINGER_MAP[k.koShift] = { code: k.code, finger: k.finger, shift: true };
  });
});

// 스페이스바
CHAR_TO_FINGER_MAP[' '] = { code: 'Space', finger: 'THUMB', shift: false };
