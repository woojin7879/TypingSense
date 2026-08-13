/**
 * TypingSense 공통 타입 정의
 */

export type FingerId =
  | 'L_PINKY'
  | 'L_RING'
  | 'L_MIDDLE'
  | 'L_INDEX'
  | 'THUMB'
  | 'R_INDEX'
  | 'R_MIDDLE'
  | 'R_RING'
  | 'R_PINKY';

export type HandSide = 'Left' | 'Right' | 'Both';

export interface FingerConfig {
  id: FingerId;
  hand: HandSide;
  name: string;
  enName: string;
  color: string;
  bg: string;
  border: string;
}

export interface KeyDefinition {
  code: string;
  en?: string;
  enShift?: string;
  ko?: string;
  koShift?: string;
  mac?: string;
  win?: string;
  finger: FingerId;
  width?: number;
  home?: boolean;
  bump?: boolean;
  special?: boolean;
  isSpace?: boolean;
}

export interface KeyMappingInfo {
  code: string;
  finger: FingerId;
  shift?: boolean;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  flexion?: number;
}

export interface HandData {
  hand: 'Left' | 'Right';
  score: number;
  landmarks: LandmarkPoint[];
}

export interface MotionFinger {
  velocityY: number;
  dz?: number;
  currentPos: LandmarkPoint;
}

export type MotionState = Record<string, MotionFinger>;

export interface CalibrationPoint {
  x: number;
  y: number;
}

export interface CalibrationCorners {
  topLeft: CalibrationPoint;
  topRight: CalibrationPoint;
  bottomRight: CalibrationPoint;
  bottomLeft: CalibrationPoint;
}

export interface SpatialUV {
  u: number;
  v: number;
  isInside: boolean;
}

export interface TargetKeyUV {
  code: string;
  row: number;
  u: number;
  v: number;
  uSpan: number;
  vSpan: number;
  finger: FingerId;
}

export interface SpatialEvaluation {
  matchScore: number;
  distance: number;
  rowDiff: number;
  isClose: boolean;
  uv?: SpatialUV;
  targetUV?: TargetKeyUV;
}

export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface SensitivityPreset {
  id: SensitivityLevel;
  name: string;
  minVelocity: number;
  strikeScore: number;
  spatialTolerance: number;
  description: string;
}

export interface KeystrokeItem {
  char: string;
  charIndex: number;
  isHangul?: boolean;
  isCho?: boolean;
  isJung?: boolean;
  isJong?: boolean;
  shift?: boolean;
}

export interface LessonItem {
  id: string;
  title: string;
  desc: string;
  text: string;
}

export interface PracticeCategory {
  id: string;
  name: string;
  icon: string;
  items: LessonItem[];
}

export interface TypingStats {
  cpm: number;
  wpm: number;
  accuracy: number;
  fingeringAccuracy: number;
  fingerErrors: number;
}

export interface ValidationResult {
  isValid: boolean;
  expectedFinger: FingerConfig | null;
  detectedFinger: FingerConfig | null;
  reason: string;
  spatialInfo?: SpatialEvaluation | null;
  shouldBlock?: boolean;
  confidence?: number;
  warning?: string;
}
