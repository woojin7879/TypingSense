import React from 'react';
import { KEYBOARD_ROWS, FINGERS } from '../modules/keyboardLayout';
import { KeyMappingInfo } from '../types';

export interface VirtualKeyboardProps {
  targetKeyInfo: KeyMappingInfo | null;
  pressedKeyCode: string | null;
  errorKeyCode: string | null;
  osMode?: 'mac' | 'win';
}

export default function VirtualKeyboard({
  targetKeyInfo,
  pressedKeyCode,
  errorKeyCode,
  osMode = 'mac'
}: VirtualKeyboardProps) {
  return (
    <div className="keyboard-section">
      <div className="keyboard-toolbar">
        <span>표준 10손가락 운지법 가이드</span>
        <span>{osMode === 'mac' ? 'Mac Layout' : 'Windows Layout'}</span>
      </div>

      <div className="keyboard-grid">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={`row-${rowIdx}`} className="keyboard-row">
            {row.map((key) => {
              const isTarget = targetKeyInfo && (targetKeyInfo.code === key.code);
              const isPressed = pressedKeyCode === key.code;
              const isError = errorKeyCode === key.code;
              const finger = FINGERS[key.finger];

              // OS별 라벨 분기 (Mac/Win)
              let mainLabel = key.ko || key.en || '';
              let topLabel = key.enShift || key.koShift || '';

              if (key.mac && osMode === 'mac') {
                mainLabel = key.mac;
                topLabel = '';
              } else if (key.win && osMode === 'win') {
                mainLabel = key.win;
                topLabel = '';
              }

              return (
                <div
                  key={key.code}
                  className={`key-cap ${isPressed ? 'pressed' : ''} ${isTarget ? 'target' : ''} ${isError ? 'error-shake' : ''}`}
                  style={{
                    flex: key.width || 1,
                    borderColor: isTarget ? finger?.color : undefined
                  }}
                >
                  {topLabel && <span className="key-top-label">{topLabel}</span>}
                  <span className="key-main-label">{mainLabel}</span>
                  {key.bump && <div className="key-bump" />}
                  {finger && (
                    <div
                      className="finger-indicator-bar"
                      style={{ backgroundColor: finger.color }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 10손가락 범례 */}
      <div className="finger-legend">
        {Object.values(FINGERS).map((f) => (
          <div key={f.id} className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: f.color }} />
            <span>{f.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
