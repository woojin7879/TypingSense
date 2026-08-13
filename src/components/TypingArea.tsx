import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { decomposeTextToKeystrokes } from '../modules/hangulUtils';
import { CHAR_TO_FINGER_MAP, FINGERS } from '../modules/keyboardLayout';
import { fingeringEngine } from '../modules/fingeringEngine';
import { soundManager } from '../modules/soundManager';
import { HandData, KeyMappingInfo, LessonItem, MotionState, TypingStats } from '../types';

export interface TypingAreaProps {
  currentLesson: LessonItem;
  handsData: HandData[];
  motionState: MotionState;
  strictMode: boolean;
  onLessonComplete: (stats: TypingStats) => void;
  setTargetKeyInfo: React.Dispatch<React.SetStateAction<KeyMappingInfo | null>>;
  setPressedKeyCode: React.Dispatch<React.SetStateAction<string | null>>;
  setErrorKeyCode: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface FeedbackState {
  type: 'error' | 'success' | 'warning';
  message: string;
}

export default function TypingArea({
  currentLesson,
  handsData,
  motionState,
  strictMode,
  onLessonComplete,
  setTargetKeyInfo,
  setPressedKeyCode,
  setErrorKeyCode
}: TypingAreaProps) {
  const [keystrokeIndex, setKeystrokeIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalErrors, setTotalErrors] = useState<number>(0);
  const [fingerErrors, setFingerErrors] = useState<number>(0);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 현재 레슨 텍스트를 물리 키스트로크 배열로 분해
  const keystrokes = useMemo(() => {
    if (!currentLesson || !currentLesson.text) return [];
    return decomposeTextToKeystrokes(currentLesson.text);
  }, [currentLesson]);

  const currentKeystroke = keystrokes[keystrokeIndex] || null;

  // 현재 타겟 키 정보 계산 및 가상 키보드/손 트래커에 전달
  const targetKey: KeyMappingInfo | null = useMemo(() => {
    if (!currentKeystroke) return null;
    const char = currentKeystroke.char;
    const mapping = CHAR_TO_FINGER_MAP[char] || CHAR_TO_FINGER_MAP[char.toLowerCase()];
    return mapping || { code: 'KeyA', finger: 'L_PINKY' };
  }, [currentKeystroke]);

  useEffect(() => {
    setTargetKeyInfo(targetKey);
  }, [targetKey, setTargetKeyInfo]);

  // 레슨 변경 시 초기화
  useEffect(() => {
    setKeystrokeIndex(0);
    setStartTime(null);
    setTotalErrors(0);
    setFingerErrors(0);
    setFeedback(null);
    fingeringEngine.resetStats();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentLesson]);

  // 클릭 시 포커스 유지
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 실시간 통계 계산
  const stats = useMemo(() => {
    const elapsedSeconds = startTime ? Math.max((Date.now() - startTime) / 1000, 1) : 0;
    const cpm = elapsedSeconds > 0 ? Math.round((keystrokeIndex / elapsedSeconds) * 60) : 0;
    const wpm = Math.round(cpm / 5);
    
    const totalTyped = keystrokeIndex + totalErrors;
    const accuracy = totalTyped > 0 ? Math.round((keystrokeIndex / totalTyped) * 100) : 100;
    const fingeringAccuracy = fingeringEngine.getAccuracy();

    return { cpm, wpm, accuracy, fingeringAccuracy };
  }, [keystrokeIndex, totalErrors, startTime]);

  // 키 입력 핸들러 (핵심 운지법 검증 및 타자 차단 로직)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 기능키 통과
    if (['F5', 'F12', 'Tab', 'Escape'].includes(e.key)) return;

    if (!startTime) {
      setStartTime(Date.now());
    }

    setPressedKeyCode(e.code);
    setTimeout(() => setPressedKeyCode(null), 120);

    if (!currentKeystroke) return;

    // 운지법 검증
    const validation = fingeringEngine.validateKeyPress(e, currentKeystroke, handsData, motionState);

    if (validation.shouldBlock) {
      // 🚫 잘못된 손가락으로 누른 경우: 타자 즉각 차단!
      e.preventDefault();
      setFingerErrors(prev => prev + 1);
      setTotalErrors(prev => prev + 1);
      setErrorKeyCode(e.code);
      setTimeout(() => setErrorKeyCode(null), 400);

      soundManager.playFingerError();
      setFeedback({
        type: 'error',
        message: validation.reason || '올바른 손가락을 사용하세요!'
      });
      return;
    }

    // 올바른 손가락을 쓴 경우 (또는 코칭 모드)
    soundManager.playKeypress(e.shiftKey);

    if (validation.warning) {
      setFeedback({ type: 'warning', message: validation.warning });
    } else {
      setFeedback(null);
    }

    // 다음 글자 전진
    const nextIdx = keystrokeIndex + 1;
    setKeystrokeIndex(nextIdx);

    // 완료 체크
    if (nextIdx >= keystrokes.length) {
      soundManager.playSuccess();
      const finalElapsed = startTime ? (Date.now() - startTime) / 1000 : 1;
      const finalCpm = Math.round((keystrokes.length / finalElapsed) * 60);
      const finalWpm = Math.round(finalCpm / 5);
      const finalFingeringAcc = fingeringEngine.getAccuracy();

      if (onLessonComplete) {
        onLessonComplete({
          cpm: finalCpm,
          wpm: finalWpm,
          accuracy: stats.accuracy,
          fingeringAccuracy: finalFingeringAcc,
          fingerErrors
        });
      }
    }
  };

  const currentFinger = targetKey ? FINGERS[targetKey.finger] : null;

  return (
    <div className="typing-card" onClick={handleContainerClick}>
      {/* Hidden input to capture key events on mobile / desktop */}
      <input
        ref={inputRef}
        type="text"
        className="typing-hidden-input"
        onKeyDown={handleKeyDown}
        autoFocus
      />

      {/* Real-time HUD Stats Row */}
      <div className="hud-stats-row">
        <div className="stat-box">
          <span className="stat-label">타수 (CPM)</span>
          <span className="stat-value highlight">{stats.cpm}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">속도 (WPM)</span>
          <span className="stat-value">{stats.wpm}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">정확도</span>
          <span className="stat-value">{stats.accuracy}%</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">운지법 준수율</span>
          <span className="stat-value success">{stats.fingeringAccuracy}%</span>
        </div>
      </div>

      {/* Target Text Display Area */}
      <div className="text-display-box">
        {currentLesson.text.split('').map((char, charIdx) => {
          const currentOriginalCharIdx = currentKeystroke ? currentKeystroke.charIndex : keystrokes.length;
          let status = 'pending';
          if (charIdx < currentOriginalCharIdx) {
            status = 'correct';
          } else if (charIdx === currentOriginalCharIdx) {
            status = 'current';
          }

          return (
            <span key={`char-${charIdx}`} className={`char-item ${status}`}>
              {char}
            </span>
          );
        })}
      </div>

      {/* Current Target Finger Banner */}
      {currentFinger && (
        <div className="current-finger-banner">
          <div className="finger-color-dot" style={{ backgroundColor: currentFinger.color }} />
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>현재 눌러야 할 손가락: </span>
            <strong style={{ color: currentFinger.color }}>{currentFinger.name}</strong>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
              (키: {currentKeystroke?.char === ' ' ? '스페이스바' : currentKeystroke?.char})
            </span>
          </div>
        </div>
      )}

      {/* Live Feedback Toast */}
      {feedback && (
        <div className={`feedback-banner ${feedback.type}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'error' && <AlertTriangle size={18} />}
            {feedback.type === 'warning' && <AlertTriangle size={18} />}
            {feedback.type === 'success' && <CheckCircle2 size={18} />}
            <span>{feedback.message}</span>
          </div>
          {feedback.type === 'error' && strictMode && (
            <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>입력 차단됨</span>
          )}
        </div>
      )}
    </div>
  );
}
