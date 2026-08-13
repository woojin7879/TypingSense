/**
 * 키보드 공간 좌표 매핑 및 정밀 타건 검증 엔진 (TypeScript)
 */
import { KEYBOARD_ROWS } from './keyboardLayout';
import {
  CalibrationCorners,
  CalibrationPoint,
  FingerId,
  HandData,
  SensitivityLevel,
  SensitivityPreset,
  SpatialEvaluation,
  SpatialUV,
  TargetKeyUV
} from '../types';

const STORAGE_KEY = 'typingsense_keyboard_calib';

// 기본 4점 모서리 좌표 (정규화된 0.0 ~ 1.0 비율)
export const DEFAULT_CORNERS: CalibrationCorners = {
  topLeft: { x: 0.14, y: 0.38 },      // Tab / Q열 좌상단
  topRight: { x: 0.86, y: 0.38 },     // Backspace / P열 우상단
  bottomRight: { x: 0.92, y: 0.88 },  // Right Ctrl / Enter열 우하단
  bottomLeft: { x: 0.08, y: 0.88 }    // Left Ctrl / Z열 좌하단
};

// 키보드 각 행의 표준 정규화 중심 v 위치 (0: 숫자열, 1: QWERTY, 2: ASDF, 3: ZXCV, 4: 스페이스바)
export const ROW_V_CENTERS: readonly number[] = [0.10, 0.30, 0.52, 0.74, 0.92];

// 주요 키의 정규화된 (u, v) 좌표 사전 계산 매핑
export const KEY_UV_MAP: Record<string, TargetKeyUV> = {};

// 키보드 레이아웃 기반으로 모든 키의 표준 (u, v) 중심점 및 너비 자동 빌드
KEYBOARD_ROWS.forEach((row, rowIdx) => {
  const vCenter = ROW_V_CENTERS[rowIdx] || (rowIdx / 4);
  const totalRowWidth = row.reduce((sum, k) => sum + (k.width || 1), 0);
  let currentOffset = 0;

  row.forEach(k => {
    const w = k.width || 1;
    const uCenter = (currentOffset + w / 2) / totalRowWidth;
    const uSpan = w / totalRowWidth;

    KEY_UV_MAP[k.code] = {
      code: k.code,
      row: rowIdx,
      u: uCenter,
      v: vCenter,
      uSpan: uSpan,
      vSpan: 0.20,
      finger: k.finger
    };

    currentOffset += w;
  });
});

export const SENSITIVITY_PRESETS: Record<SensitivityLevel, SensitivityPreset> = {
  low: {
    id: 'low',
    name: '낮음 (부드러운 감지)',
    minVelocity: 0.12,
    strikeScore: 0.15,
    spatialTolerance: 0.22,
    description: '작은 손가락 움직임도 빠르게 감지합니다.'
  },
  medium: {
    id: 'medium',
    name: '보통 (추천)',
    minVelocity: 0.22,
    strikeScore: 0.25,
    spatialTolerance: 0.16,
    description: '공중 까딱임을 무시하고 실제 타건만 인식합니다.'
  },
  high: {
    id: 'high',
    name: '높음 (엄격한 감지)',
    minVelocity: 0.35,
    strikeScore: 0.40,
    spatialTolerance: 0.11,
    description: '확실하게 키보드 표면을 누를 때만 인식합니다.'
  }
};

export class SpatialEngine {
  public corners: CalibrationCorners;
  public sensitivityLevel: SensitivityLevel;
  public enabled: boolean;

  constructor() {
    this.corners = { ...DEFAULT_CORNERS };
    this.sensitivityLevel = 'medium';
    this.enabled = true;
    this.loadFromStorage();
  }

  /**
   * 로컬 스토리지에서 캘리브레이션 설정 로드
   */
  public loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.corners && data.corners.topLeft && data.corners.topRight) {
          this.corners = data.corners;
        }
        if (data.sensitivityLevel && SENSITIVITY_PRESETS[data.sensitivityLevel as SensitivityLevel]) {
          this.sensitivityLevel = data.sensitivityLevel as SensitivityLevel;
        }
        if (typeof data.enabled === 'boolean') {
          this.enabled = data.enabled;
        }
      }
    } catch (e) {
      console.warn('캘리브레이션 데이터 로드 오류:', e);
    }
  }

  /**
   * 캘리브레이션 설정 저장
   */
  public saveToStorage(): boolean {
    try {
      const data = {
        corners: this.corners,
        sensitivityLevel: this.sensitivityLevel,
        enabled: this.enabled,
        updatedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('캘리브레이션 데이터 저장 실패:', e);
      return false;
    }
  }

  /**
   * 기본값으로 리셋
   */
  public resetToDefaults(): void {
    this.corners = {
      topLeft: { ...DEFAULT_CORNERS.topLeft },
      topRight: { ...DEFAULT_CORNERS.topRight },
      bottomRight: { ...DEFAULT_CORNERS.bottomRight },
      bottomLeft: { ...DEFAULT_CORNERS.bottomLeft }
    };
    this.sensitivityLevel = 'medium';
    this.saveToStorage();
  }

  /**
   * 키보드 평면의 정규화 좌표 (u, v)를 카메라 화면 좌표 (x, y)로 이중 선형 보간 (Bilinear Interpolation)
   */
  public keyboardToCameraPoint(u: number, v: number): CalibrationPoint {
    const { topLeft, topRight, bottomRight, bottomLeft } = this.corners;

    // 상단선 상의 점
    const topX = topLeft.x + (topRight.x - topLeft.x) * u;
    const topY = topLeft.y + (topRight.y - topLeft.y) * u;

    // 하단선 상의 점
    const botX = bottomLeft.x + (bottomRight.x - bottomLeft.x) * u;
    const botY = bottomLeft.y + (bottomRight.y - bottomLeft.y) * u;

    // 상/하단선 사이를 v 비율로 보간
    return {
      x: topX + (botX - topX) * v,
      y: topY + (botY - topY) * v
    };
  }

  /**
   * 카메라 화면 상의 점 (x, y)를 키보드 정규화 좌표 (u, v)로 역변환
   */
  public cameraToKeyboardUV(px: number, py: number): SpatialUV {
    let u = 0.5;
    let v = 0.5;

    for (let i = 0; i < 5; i++) {
      const p = this.keyboardToCameraPoint(u, v);
      const errX = px - p.x;
      const errY = py - p.y;

      const du = 0.01;
      const dv = 0.01;
      const pU = this.keyboardToCameraPoint(u + du, v);
      const pV = this.keyboardToCameraPoint(u, v + dv);

      const dxdu = (pU.x - p.x) / du;
      const dydu = (pU.y - p.y) / du;
      const dxdv = (pV.x - p.x) / dv;
      const dydv = (pV.y - p.y) / dv;

      const det = dxdu * dydv - dydu * dxdv;
      if (Math.abs(det) < 1e-6) break;

      const deltaU = (dydv * errX - dxdv * errY) / det;
      const deltaV = (-dydu * errX + dxdu * errY) / det;

      u += deltaU;
      v += deltaV;
    }

    const isInside = (u >= -0.05 && u <= 1.05 && v >= -0.05 && v <= 1.05);

    return {
      u: Math.max(-0.2, Math.min(1.2, u)),
      v: Math.max(-0.2, Math.min(1.2, v)),
      isInside
    };
  }

  /**
   * 주어진 키 코드의 예상 화면 좌표 및 바운딩 박스 계산
   */
  public getKeyScreenPosition(keyCode: string): {
    center: CalibrationPoint;
    corners: { tl: CalibrationPoint; tr: CalibrationPoint; br: CalibrationPoint; bl: CalibrationPoint };
    u: number;
    v: number;
    row: number;
    finger: FingerId;
  } | null {
    const keyUV = KEY_UV_MAP[keyCode];
    if (!keyUV) return null;

    const center = this.keyboardToCameraPoint(keyUV.u, keyUV.v);
    const tl = this.keyboardToCameraPoint(keyUV.u - keyUV.uSpan / 2, keyUV.v - keyUV.vSpan / 2);
    const tr = this.keyboardToCameraPoint(keyUV.u + keyUV.uSpan / 2, keyUV.v - keyUV.vSpan / 2);
    const br = this.keyboardToCameraPoint(keyUV.u + keyUV.uSpan / 2, keyUV.v + keyUV.vSpan / 2);
    const bl = this.keyboardToCameraPoint(keyUV.u - keyUV.uSpan / 2, keyUV.v + keyUV.vSpan / 2);

    return {
      center,
      corners: { tl, tr, br, bl },
      u: keyUV.u,
      v: keyUV.v,
      row: keyUV.row,
      finger: keyUV.finger
    };
  }

  /**
   * 손가락 끝 위치와 타겟 키 사이의 공간적 일치도 평가
   */
  public evaluateFingerSpatialMatch(tipPos: CalibrationPoint | null | undefined, keyCode: string): SpatialEvaluation {
    if (!this.enabled || !tipPos) {
      return { matchScore: 1.0, distance: 0, rowDiff: 0, isClose: true };
    }

    const uv = this.cameraToKeyboardUV(tipPos.x, tipPos.y);
    const targetKeyUV = KEY_UV_MAP[keyCode];

    if (!targetKeyUV) {
      return { matchScore: 1.0, distance: 0, rowDiff: 0, isClose: true, uv };
    }

    // u, v 공간상의 거리 계산 (타원형 거리: 행 오차에 더 민감)
    const du = Math.abs(uv.u - targetKeyUV.u);
    const dv = Math.abs(uv.v - targetKeyUV.v);
    const distance = Math.sqrt(du * du + (dv * 1.6) * (dv * 1.6));

    const preset = SENSITIVITY_PRESETS[this.sensitivityLevel] || SENSITIVITY_PRESETS.medium;
    const tolerance = preset.spatialTolerance;

    // 점수: 0.0 ~ 1.0 (가까울수록 1.0)
    const matchScore = Math.max(0, 1 - (distance / (tolerance * 2.5)));
    const isClose = distance <= (tolerance * 1.5);
    const rowDiff = Math.abs(uv.v - targetKeyUV.v) / 0.22; // 몇 줄 차이나는지

    return {
      matchScore,
      distance,
      rowDiff,
      isClose,
      uv,
      targetUV: targetKeyUV
    };
  }

  /**
   * A·L 및 8손가락(ASDF-JKL;) 홈 포지션 캡처 데이터 기반 정밀 자동 캘리브레이션
   */
  public autoCalibrateFromHomeRow(handsData: HandData[]): boolean {
    if (!handsData || handsData.length < 2) {
      throw new Error('양손이 모두 카메라에 보여야 정밀 측정이 가능합니다.');
    }

    const leftHand = handsData.find(h => h.hand === 'Left');
    const rightHand = handsData.find(h => h.hand === 'Right');

    if (!leftHand || !rightHand) {
      throw new Error('왼손과 오른손을 모두 인식할 수 없습니다.');
    }

    const lmLeft = leftHand.landmarks;
    const lmRight = rightHand.landmarks;

    const pA = lmLeft[20];
    const pF = lmLeft[8];
    const pJ = lmRight[8];
    const pSemi = lmRight[20];

    if (!pA || !pF || !pJ || !pSemi) {
      throw new Error('손가락 끝 관절을 모두 감지하지 못했습니다.');
    }

    // A키(왼손 새끼 끝)와 ;/L키(오른손 새끼/약지 끝)로 홈열 양 끝단 중심선 산출
    const homeLeft = { x: pA.x, y: pA.y };
    const homeRight = { x: pSemi.x, y: pSemi.y };

    // 홈열의 전체 벡터
    const dx = homeRight.x - homeLeft.x;
    const dy = homeRight.y - homeLeft.y;
    const homeSpan = Math.sqrt(dx * dx + dy * dy);

    if (homeSpan < 0.15) {
      throw new Error('양손 사이 거리가 너무 가깝습니다. 기본 자리에 넓게 올려주세요.');
    }

    // 수직 벡터 (상단열/하단열 방향)
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;

    // 전체 키보드 폭(Tab~Backspace, Ctrl~Enter)은 A~; 홈열 폭의 약 1.35배
    const fullSpan = homeSpan * 1.35;
    const centerX = (homeLeft.x + homeRight.x) / 2;
    const centerY = (homeLeft.y + homeRight.y) / 2;

    // 키보드 상하 높이는 홈열 폭의 약 0.55배
    const keybHeight = fullSpan * 0.48;

    // 상단(QWERTY/숫자열) 및 하단(스페이스/모디파이어) 중심선 오프셋
    const upDist = keybHeight * 0.48;
    const downDist = keybHeight * 0.52;

    // 4개 모서리 생성
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const cosP = Math.cos(perpAngle);
    const sinP = Math.sin(perpAngle);

    const halfW_top = (fullSpan * 0.95) / 2;
    const halfW_bot = (fullSpan * 1.08) / 2; // 원근감 고려하여 하단이 약간 넓음

    const topCenterX = centerX - upDist * cosP;
    const topCenterY = centerY - upDist * sinP;

    const botCenterX = centerX + downDist * cosP;
    const botCenterY = centerY + downDist * sinP;

    const topLeft: CalibrationPoint = {
      x: Math.max(0.02, Math.min(0.98, topCenterX - halfW_top * cosA)),
      y: Math.max(0.05, Math.min(0.95, topCenterY - halfW_top * sinA))
    };

    const topRight: CalibrationPoint = {
      x: Math.max(0.02, Math.min(0.98, topCenterX + halfW_top * cosA)),
      y: Math.max(0.05, Math.min(0.95, topCenterY + halfW_top * sinA))
    };

    const bottomRight: CalibrationPoint = {
      x: Math.max(0.02, Math.min(0.98, botCenterX + halfW_bot * cosA)),
      y: Math.max(0.05, Math.min(0.95, botCenterY + halfW_bot * sinA))
    };

    const bottomLeft: CalibrationPoint = {
      x: Math.max(0.02, Math.min(0.98, botCenterX - halfW_bot * cosA)),
      y: Math.max(0.05, Math.min(0.95, botCenterY - halfW_bot * sinA))
    };

    this.corners = { topLeft, topRight, bottomRight, bottomLeft };
    this.saveToStorage();
    return true;
  }

  /**
   * 검지 하나로 순차적으로 누른 4개 기준 키(Q, P, /(또는 M), Z) 위치로부터 키보드 외곽 4개 모서리 산출
   */
  public calibrateFromFourKeys(points: {
    q: CalibrationPoint;
    p: CalibrationPoint;
    botRight: CalibrationPoint;
    z: CalibrationPoint;
    isSlash?: boolean; // botRight가 Slash(/)인지 M인지 여부
  }): boolean {
    const { q, p, botRight, z, isSlash = true } = points;

    // 상단열 Q~P 선분 벡터
    const topDx = p.x - q.x;
    const topDy = p.y - q.y;

    // 하단열 Z~botRight 선분 벡터
    const botDx = botRight.x - z.x;
    const botDy = botRight.y - z.y;

    // 키보드 세로 방향 벡터 (Q->Z 및 P->botRight)
    const leftDx = z.x - q.x;
    const leftDy = z.y - q.y;
    const rightDx = botRight.x - p.x;
    const rightDy = botRight.y - p.y;

    // Q키는 전체 폭의 약 12% 지점, P키는 약 86% 지점에 위치 (Q~P 비율: 74%)
    const topSpanFactor = 0.74;
    const leftMarginRatio = 0.12 / topSpanFactor;
    const rightMarginRatio = 0.14 / topSpanFactor;

    // botRight가 Slash인 경우(86% 지점)와 M인 경우(72% 지점) 분기
    const botSpanFactor = isSlash ? 0.72 : 0.60;
    const botLeftMarginRatio = 0.14 / botSpanFactor;
    const botRightMarginRatio = (isSlash ? 0.14 : 0.28) / botSpanFactor;

    // 상하단 여백 (Q/Z 키 중심에서 키보드 플라스틱 프레임 외곽까지의 확장 비율)
    // Q~Z는 전체 높이(Row 1 ~ Row 3)의 약 44% (전체 4~5개 행 대비)
    const vMarginTop = 0.38;
    const vMarginBot = 0.45;

    // 4개 외곽 모서리 계산
    const topLeft: CalibrationPoint = {
      x: Math.max(0.01, Math.min(0.99, q.x - topDx * leftMarginRatio - leftDx * vMarginTop)),
      y: Math.max(0.01, Math.min(0.99, q.y - topDy * leftMarginRatio - leftDy * vMarginTop))
    };

    const topRight: CalibrationPoint = {
      x: Math.max(0.01, Math.min(0.99, p.x + topDx * rightMarginRatio - rightDx * vMarginTop)),
      y: Math.max(0.01, Math.min(0.99, p.y + topDy * rightMarginRatio - rightDy * vMarginTop))
    };

    const bottomRight: CalibrationPoint = {
      x: Math.max(0.01, Math.min(0.99, botRight.x + botDx * botRightMarginRatio + rightDx * vMarginBot)),
      y: Math.max(0.01, Math.min(0.99, botRight.y + botDy * botRightMarginRatio + rightDy * vMarginBot))
    };

    const bottomLeft: CalibrationPoint = {
      x: Math.max(0.01, Math.min(0.99, z.x - botDx * botLeftMarginRatio + leftDx * vMarginBot)),
      y: Math.max(0.01, Math.min(0.99, z.y - botDy * botLeftMarginRatio + leftDy * vMarginBot))
    };

    this.corners = { topLeft, topRight, bottomRight, bottomLeft };
    this.saveToStorage();
    return true;
  }
}

export const spatialEngine = new SpatialEngine();
