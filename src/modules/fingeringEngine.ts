/**
 * 운지법 판정 및 공간 매핑 검증 엔진 (TypeScript)
 */
import { FINGERS, CODE_TO_FINGER_MAP, CHAR_TO_FINGER_MAP } from './keyboardLayout';
import { spatialEngine, SENSITIVITY_PRESETS } from './spatialEngine';
import { FingerId, HandData, KeystrokeItem, MotionState, SpatialEvaluation, ValidationResult } from '../types';

export interface FingeringStats {
  totalKeystrokes: number;
  correctFingeringCount: number;
  incorrectFingeringCount: number;
  fingerErrorCounts: Record<FingerId, number>;
}

export class FingeringEngine {
  public strictMode: boolean = true;
  public stats: FingeringStats = {
    totalKeystrokes: 0,
    correctFingeringCount: 0,
    incorrectFingeringCount: 0,
    fingerErrorCounts: {
      L_PINKY: 0,
      L_RING: 0,
      L_MIDDLE: 0,
      L_INDEX: 0,
      THUMB: 0,
      R_INDEX: 0,
      R_MIDDLE: 0,
      R_RING: 0,
      R_PINKY: 0
    }
  };

  /**
   * 키 입력 이벤트 및 현재 손 랜드마크 상태를 바탕으로 운지법 및 공간 좌표 유효성 판정
   */
  public validateKeyPress(
    event: KeyboardEvent | React.KeyboardEvent,
    currentTargetKeystroke: KeystrokeItem | null,
    handsData: HandData[] = [],
    motionState: MotionState = {}
  ): ValidationResult {
    const code = event.code;

    // 1. 해당 물리 키에 배정된 표준 정답 손가락 식별
    let expectedFingerId: FingerId | undefined = CODE_TO_FINGER_MAP[code];

    if (!expectedFingerId && currentTargetKeystroke) {
      const charInfo = CHAR_TO_FINGER_MAP[currentTargetKeystroke.char];
      if (charInfo) {
        expectedFingerId = charInfo.finger;
      }
    }

    if (!expectedFingerId) {
      return {
        isValid: true,
        expectedFinger: null,
        detectedFinger: null,
        reason: 'Unmapped key'
      };
    }

    const expectedFinger = FINGERS[expectedFingerId];
    this.stats.totalKeystrokes++;

    // 웹캠이 켜져 있지 않거나 손이 감지되지 않는 경우
    if (!handsData || handsData.length === 0) {
      return {
        isValid: true,
        expectedFinger,
        detectedFinger: null,
        confidence: 0,
        reason: '손 감지 대기',
        warning: '카메라에 손이 감지되지 않았습니다. 손 위치를 웹캠에 보여주세요.'
      };
    }

    // 2. 키보드 공간 좌표 및 모션 속도를 종합하여 타건 손가락 판정
    const { detectedFingerId, spatialInfo } = this.detectActiveFinger(handsData, motionState, expectedFingerId, code);
    const detectedFinger = detectedFingerId ? FINGERS[detectedFingerId] : null;

    // 3. 판정 비교
    let isValid = false;

    if (!detectedFingerId) {
      isValid = true;
    } else if (expectedFingerId === 'THUMB' && (detectedFingerId === 'THUMB' || detectedFingerId.includes('THUMB'))) {
      isValid = true;
    } else if (detectedFingerId === expectedFingerId) {
      isValid = true;
    } else {
      const expectedHand = expectedFinger.hand;
      const detectedHand = detectedFinger ? detectedFinger.hand : null;

      if (expectedHand !== 'Both' && detectedHand && detectedHand !== 'Both' && expectedHand !== detectedHand) {
        isValid = false;
      } else {
        isValid = false;
      }
    }

    // 통계 누적
    if (isValid) {
      this.stats.correctFingeringCount++;
    } else {
      this.stats.incorrectFingeringCount++;
      if (expectedFingerId && this.stats.fingerErrorCounts[expectedFingerId] !== undefined) {
        this.stats.fingerErrorCounts[expectedFingerId]++;
      }
    }

    // 피드백 메시지 생성
    let reason = '';
    if (isValid) {
      reason = `올바른 운지법: ${expectedFinger.name}`;
      if (spatialInfo && spatialInfo.isClose) {
        reason += ' (위치 일치 ✅)';
      }
    } else {
      const detectedName = detectedFinger ? detectedFinger.name : '다른 손가락';
      reason = `운지법 오류: [${expectedFinger.name}]을(를) 사용해야 합니다! (${detectedName} 감지됨)`;
    }

    return {
      isValid,
      expectedFinger,
      detectedFinger,
      reason,
      spatialInfo,
      shouldBlock: !isValid && this.strictMode
    };
  }

  /**
   * 실시간 손가락 관절, 모션 속도, 키보드 캘리브레이션 좌표를 종합하여 타건 손가락 결정
   */
  public detectActiveFinger(
    handsData: HandData[],
    motionState: MotionState,
    targetFingerId: FingerId,
    keyCode: string
  ): { detectedFingerId: FingerId | null; spatialInfo: SpatialEvaluation | null } {
    let bestFinger: FingerId | null = null;
    let maxScore = -999;
    let bestSpatialInfo: SpatialEvaluation | null = null;

    const preset = SENSITIVITY_PRESETS[spatialEngine.sensitivityLevel] || SENSITIVITY_PRESETS.medium;
    const minVelocityThreshold = preset.minVelocity;

    const fingerKeys = Object.keys(motionState);

    if (fingerKeys.length > 0) {
      fingerKeys.forEach(fIdStr => {
        const fId = fIdStr as FingerId;
        const m = motionState[fId];
        const tipPos = m.currentPos;

        // 1. [최우선] 키보드 공간 위치 일치도 (0 ~ 20점, 거리 멀면 -30점 즉시 배제)
        let spatialScore = 0;
        let spatialMatch: SpatialEvaluation | null = null;

        if (tipPos && spatialEngine.enabled) {
          spatialMatch = spatialEngine.evaluateFingerSpatialMatch(tipPos, keyCode);
          
          if (spatialMatch.matchScore > 0) {
            // 키 근처에 위치한 손가락: 일치도에 따라 최대 20점 부여
            spatialScore = spatialMatch.matchScore * 20.0;
          } else {
            // 눌린 키와 거리가 먼 손가락: 즉시 큰 패널티로 배제 (-30점)
            spatialScore = -30.0;
          }
        } else {
          // 캘리브레이션 미활성화 시 기본 점수
          spatialScore = 5.0;
        }

        // 2. 하강 속도(Velocity): 위치가 맞는 손가락들 중에서 실제 누른 동작 검증 (최대 +5점)
        let velocityBonus = 0;
        if (m.velocityY > minVelocityThreshold) {
          velocityBonus = Math.min(5.0, m.velocityY * 8.0);
        } else {
          velocityBonus = -1.0;
        }

        // 3. 정답 타겟 손가락 소폭 보너스 (+1.5점)
        let targetBonus = 0;
        if (targetFingerId && fId === targetFingerId) {
          targetBonus = 1.5;
        }

        const totalScore = spatialScore + velocityBonus + targetBonus;

        if (totalScore > maxScore && totalScore > 0) {
          maxScore = totalScore;
          bestFinger = fId;
          bestSpatialInfo = spatialMatch;
        }
      });
    }

    // 모션 속도가 매우 낮을 때 손 위치 기반 보조 판정
    if (!bestFinger && handsData.length > 0) {
      const hasLeft = handsData.some(h => h.hand === 'Left');
      const hasRight = handsData.some(h => h.hand === 'Right');

      const expectedFinger = FINGERS[targetFingerId];
      if (expectedFinger) {
        if (expectedFinger.hand === 'Left' && hasLeft && !hasRight) {
          return { detectedFingerId: targetFingerId, spatialInfo: null };
        }
        if (expectedFinger.hand === 'Right' && hasRight && !hasLeft) {
          return { detectedFingerId: targetFingerId, spatialInfo: null };
        }
      }
    }

    return {
      detectedFingerId: bestFinger || targetFingerId,
      spatialInfo: bestSpatialInfo
    };
  }

  public getAccuracy(): number {
    if (this.stats.totalKeystrokes === 0) return 100;
    return Math.round((this.stats.correctFingeringCount / this.stats.totalKeystrokes) * 100);
  }

  public resetStats(): void {
    this.stats = {
      totalKeystrokes: 0,
      correctFingeringCount: 0,
      incorrectFingeringCount: 0,
      fingerErrorCounts: {
        L_PINKY: 0,
        L_RING: 0,
        L_MIDDLE: 0,
        L_INDEX: 0,
        THUMB: 0,
        R_INDEX: 0,
        R_MIDDLE: 0,
        R_RING: 0,
        R_PINKY: 0
      }
    };
  }
}

export const fingeringEngine = new FingeringEngine();
