import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Crosshair, Sparkles, Sliders, CheckCircle2, RotateCcw, Hand, Zap, Camera, Check, ArrowRight, MousePointerClick } from 'lucide-react';
import { spatialEngine, SENSITIVITY_PRESETS } from '../modules/spatialEngine';
import { FINGERS, CODE_TO_FINGER_MAP } from '../modules/keyboardLayout';
import { soundManager } from '../modules/soundManager';
import { HandTracker } from '../modules/handTracker';
import {
  CalibrationCorners,
  CalibrationPoint,
  FingerConfig,
  FingerId,
  HandData,
  MotionState,
  SensitivityLevel,
  SensitivityPreset,
  SpatialEvaluation
} from '../types';

export interface KeyboardCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  handsData?: HandData[];
  motionState?: MotionState;
  trackerRef?: React.MutableRefObject<HandTracker | null>;
  cameraActive?: boolean;
  onToggleCamera?: () => Promise<void> | void;
}

interface TestStrikeState {
  code: string;
  key: string;
  expectedFinger: FingerConfig | null;
  detectedFinger: FingerConfig | null;
  velocity: number;
  spatialEvaluation: SpatialEvaluation | null;
  timestamp: number;
}

interface CornerHandle {
  key: keyof CalibrationCorners;
  label: string;
  hint: string;
  pos: CalibrationPoint;
  color: string;
}

interface SeqStepConfig {
  step: number;
  keyName: 'q' | 'p' | 'botRight' | 'z';
  keyCode: string;
  altKeyCode?: string;
  label: string;
  subLabel: string;
  handHint: string;
  guideText: string;
  defaultUv: { u: number; v: number };
  color: string;
}

const SEQ_STEPS: SeqStepConfig[] = [
  {
    step: 0,
    keyName: 'q',
    keyCode: 'KeyQ',
    label: 'Q',
    subLabel: '좌상단 모서리',
    handHint: '왼손 검지',
    guideText: '검지손가락 하나를 펴서 키보드의 [ Q ] (또는 ㅂ) 키를 콕 눌러주세요.',
    defaultUv: { u: 0.12, v: 0.30 },
    color: '#f43f5e'
  },
  {
    step: 1,
    keyName: 'p',
    keyCode: 'KeyP',
    label: 'P',
    subLabel: '우상단 모서리',
    handHint: '오른손 검지',
    guideText: '검지손가락 하나를 펴서 키보드의 [ P ] (또는 ㅔ) 키를 콕 눌러주세요.',
    defaultUv: { u: 0.86, v: 0.30 },
    color: '#d946ef'
  },
  {
    step: 2,
    keyName: 'botRight',
    keyCode: 'Slash',
    altKeyCode: 'KeyM',
    label: '/ (또는 M)',
    subLabel: '우하단 모서리',
    handHint: '오른손 검지',
    guideText: '검지손가락 하나를 펴서 키보드의 [ / ] (또는 [ M ]) 키를 콕 눌러주세요.',
    defaultUv: { u: 0.86, v: 0.74 },
    color: '#3b82f6'
  },
  {
    step: 3,
    keyName: 'z',
    keyCode: 'KeyZ',
    label: 'Z',
    subLabel: '좌하단 모서리',
    handHint: '왼손 검지',
    guideText: '검지손가락 하나를 펴서 키보드의 [ Z ] (또는 ㅋ) 키를 콕 눌러주세요.',
    defaultUv: { u: 0.14, v: 0.74 },
    color: '#10b981'
  }
];

export default function KeyboardCalibrationModal({
  isOpen,
  onClose,
  handsData = [],
  motionState = {},
  trackerRef,
  cameraActive = false,
  onToggleCamera
}: KeyboardCalibrationModalProps) {
  const [corners, setCorners] = useState<CalibrationCorners>(() => ({ ...spatialEngine.corners }));
  const [sensitivityLevel, setSensitivityLevel] = useState<SensitivityLevel>(() => spatialEngine.sensitivityLevel);
  const [draggingCorner, setDraggingCorner] = useState<keyof CalibrationCorners | null>(null);
  const [activeTab, setActiveTab] = useState<'seqIndex' | 'drag' | 'autorow'>('seqIndex');
  
  // 검지 순차 측정 상태 (Step 0, 1, 2, 3, 4=완료)
  const [seqStep, setSeqStep] = useState<number>(0);
  const [capturedSeqPoints, setCapturedSeqPoints] = useState<{
    q?: CalibrationPoint;
    p?: CalibrationPoint;
    botRight?: CalibrationPoint;
    z?: CalibrationPoint;
    isSlash?: boolean;
  }>({});
  const [seqStatusMessage, setSeqStatusMessage] = useState<{ type: 'info' | 'success' | 'warning'; text: string } | null>(null);

  // 8손가락 자동 측정 카운트다운 상태
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoCalibMessage, setAutoCalibMessage] = useState<{ type: 'error' | 'info' | 'success'; text: string } | null>(null);

  // 실시간 타건 테스트 결과
  const [testStrike, setTestStrike] = useState<TestStrikeState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 모달이 열리거나 카메라 상태가 변경될 때 웹캠 비디오 스트림 연결
  useEffect(() => {
    let timeoutId: number;

    const attachStream = () => {
      if (isOpen && videoRef.current && trackerRef?.current) {
        const stream = trackerRef.current.getStream();
        if (stream && videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn('Modal video play catch:', e));
        }
      }
    };

    attachStream();
    if (isOpen && cameraActive) {
      timeoutId = window.setTimeout(attachStream, 250);
    }

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, cameraActive, trackerRef]);

  // 모달이 열릴 때 최신 설정값 동기화
  useEffect(() => {
    if (isOpen) {
      spatialEngine.loadFromStorage();
      setCorners({ ...spatialEngine.corners });
      setSensitivityLevel(spatialEngine.sensitivityLevel);
      setTestStrike(null);
      setSeqStep(0);
      setCapturedSeqPoints({});
      setSeqStatusMessage(null);
    }
  }, [isOpen]);

  // 현재 화면에서 감지되는 검지 끝(Index Fingertip, Landmark #8) 추출 헬퍼
  const getDetectedFingertip = useCallback((targetHandHint?: string): CalibrationPoint | null => {
    if (handsData.length === 0) return null;

    let targetHand = handsData[0];
    if (handsData.length > 1 && targetHandHint) {
      const isLeft = targetHandHint.includes('왼손');
      const matched = handsData.find(h => (isLeft ? h.hand === 'Left' : h.hand === 'Right'));
      if (matched) targetHand = matched;
    }

    const lm8 = targetHand.landmarks[8]; // Index Tip
    if (lm8) {
      // 미러링된 뷰포트 좌표 [0, 1]
      return { x: 1 - lm8.x, y: lm8.y };
    }

    return null;
  }, [handsData]);

  // 키보드 키 이벤트 리스너 (순차 검지 타건 측정 및 실시간 테스트)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Escape', 'Tab', 'F5', 'F12'].includes(e.key)) return;

      const code = e.code;

      // 1. 순차 검지 타건 모드 처리
      if (activeTab === 'seqIndex' && seqStep < 4) {
        const currentCfg = SEQ_STEPS[seqStep];
        const isMatched = code === currentCfg.keyCode || (currentCfg.altKeyCode && code === currentCfg.altKeyCode);

        if (isMatched) {
          e.preventDefault();
          const tipPos = getDetectedFingertip(currentCfg.handHint);

          if (!tipPos) {
            soundManager.playFingerError();
            setSeqStatusMessage({
              type: 'warning',
              text: `⚠️ [${currentCfg.label}] 키를 누른 손가락이 카메라 화면에 보이지 않습니다. 손을 화면에 보이게 올려주세요.`
            });
            return;
          }

          // 해당 키의 좌표 캡처
          soundManager.playKeypress(true);
          const nextPoints = { ...capturedSeqPoints };
          if (currentCfg.keyName === 'q') nextPoints.q = tipPos;
          if (currentCfg.keyName === 'p') nextPoints.p = tipPos;
          if (currentCfg.keyName === 'botRight') {
            nextPoints.botRight = tipPos;
            nextPoints.isSlash = code === 'Slash';
          }
          if (currentCfg.keyName === 'z') nextPoints.z = tipPos;

          setCapturedSeqPoints(nextPoints);

          const nextStep = seqStep + 1;
          setSeqStep(nextStep);

          if (nextStep < 4) {
            setSeqStatusMessage({
              type: 'info',
              text: `✅ [${currentCfg.label}] 측정 완료! 다음 ${SEQ_STEPS[nextStep].label} 키를 눌러주세요.`
            });
          } else {
            // 4개 기준점 모두 측정 완료!
            if (nextPoints.q && nextPoints.p && nextPoints.botRight && nextPoints.z) {
              spatialEngine.calibrateFromFourKeys({
                q: nextPoints.q,
                p: nextPoints.p,
                botRight: nextPoints.botRight,
                z: nextPoints.z,
                isSlash: nextPoints.isSlash !== false
              });
              setCorners({ ...spatialEngine.corners });
              soundManager.playSuccess();
              setSeqStatusMessage({
                type: 'success',
                text: '🎉 Q, P, /, Z 4개 기준 키 측정 완료! 키보드 영역이 자동으로 생성되었습니다.'
              });
            }
          }
          return;
        }
      }

      // 2. 실시간 타건 테스트 HUD 반영
      const expectedFingerId = CODE_TO_FINGER_MAP[code];
      const expectedFinger = expectedFingerId ? FINGERS[expectedFingerId] : null;

      let bestFingerId: FingerId | null = null;
      let maxVelocity = 0;
      let bestTipPos: CalibrationPoint | null = null;

      Object.entries(motionState).forEach(([fIdStr, m]) => {
        if (m.velocityY > maxVelocity) {
          maxVelocity = m.velocityY;
          bestFingerId = fIdStr as FingerId;
          bestTipPos = m.currentPos;
        }
      });

      let spatialEvaluation: SpatialEvaluation | null = null;
      if (bestTipPos) {
        spatialEvaluation = spatialEngine.evaluateFingerSpatialMatch(bestTipPos, code);
      }

      setTestStrike({
        code,
        key: e.key,
        expectedFinger,
        detectedFinger: bestFingerId ? FINGERS[bestFingerId] : null,
        velocity: maxVelocity,
        spatialEvaluation,
        timestamp: Date.now()
      });

      soundManager.playKeypress(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, seqStep, capturedSeqPoints, getDetectedFingertip, motionState]);

  // 드래그 시작
  const handlePointerDown = (cornerKey: keyof CalibrationCorners, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingCorner(cornerKey);
  };

  // 드래그 중 좌표 갱신 (정규화된 0.0 ~ 1.0)
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggingCorner || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));

    setCorners(prev => {
      const next: CalibrationCorners = { ...prev, [draggingCorner]: { x, y } };
      spatialEngine.corners = next;
      return next;
    });
  }, [draggingCorner]);

  const handlePointerUp = useCallback(() => {
    setDraggingCorner(null);
  }, []);

  useEffect(() => {
    if (draggingCorner) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [draggingCorner, handlePointerMove, handlePointerUp]);

  // 8손가락(ASDF-JKL;) 자동 캘리브레이션 실행
  const startAutoCalibration = () => {
    if (handsData.length < 2) {
      setAutoCalibMessage({
        type: 'error',
        text: '양손이 모두 웹캠에 보여야 합니다. 양손을 기본 자리에 올려주세요.'
      });
      return;
    }

    setCountdown(3);
    setAutoCalibMessage({
      type: 'info',
      text: '양손 8손가락을 A·S·D·F — J·K·L·; 키 위에 올려놓고 유지해주세요!'
    });

    let current = 3;
    const interval = setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
      } else {
        clearInterval(interval);
        setCountdown(null);

        try {
          spatialEngine.autoCalibrateFromHomeRow(handsData);
          setCorners({ ...spatialEngine.corners });
          soundManager.playSuccess();
          setAutoCalibMessage({
            type: 'success',
            text: '✅ A·L 및 8손가락 홈 포지션 정밀 캘리브레이션 완료!'
          });
        } catch (err: unknown) {
          soundManager.playFingerError();
          const message = err instanceof Error ? err.message : '알 수 없는 오류';
          setAutoCalibMessage({
            type: 'error',
            text: `⚠️ 측정 실패: ${message}`
          });
        }
      }
    }, 1000);
  };

  // 저장 및 적용
  const handleSave = () => {
    spatialEngine.corners = corners;
    spatialEngine.sensitivityLevel = sensitivityLevel;
    spatialEngine.saveToStorage();
    onClose();
  };

  // 기본값 초기화
  const handleReset = () => {
    spatialEngine.resetToDefaults();
    setCorners({ ...spatialEngine.corners });
    setSensitivityLevel('medium');
    setSeqStep(0);
    setCapturedSeqPoints({});
    setSeqStatusMessage({ type: 'info', text: '기본 위치로 초기화되었습니다.' });
  };

  if (!isOpen) return null;

  // 가상 격자 라인 생성을 위한 헬퍼 (Bilinear 좌표 계산)
  const interpolatePoint = (u: number, v: number): CalibrationPoint => {
    const { topLeft: TL, topRight: TR, bottomRight: BR, bottomLeft: BL } = corners;
    const topX = TL.x + (TR.x - TL.x) * u;
    const topY = TL.y + (TR.y - TL.y) * u;
    const botX = BL.x + (BR.x - BL.x) * u;
    const botY = BL.y + (BR.y - BL.y) * u;
    return {
      x: topX + (botX - topX) * v,
      y: topY + (botY - topY) * v
    };
  };

  // 4개 모서리 라벨 & 색상
  const cornerHandles: CornerHandle[] = [
    { key: 'topLeft', label: '좌상단 (Q열)', hint: 'Tab/Q', pos: corners.topLeft, color: '#f43f5e' },
    { key: 'topRight', label: '우상단 (P열)', hint: 'P/Backspace', pos: corners.topRight, color: '#d946ef' },
    { key: 'bottomRight', label: '우하단 (Enter열)', hint: 'Enter/Ctrl', pos: corners.bottomRight, color: '#6366f1' },
    { key: 'bottomLeft', label: '좌하단 (Z열)', hint: 'Ctrl/Z', pos: corners.bottomLeft, color: '#10b981' }
  ];

  // 홈열(A-L) 중심선 계산
  const homeA = interpolatePoint(0.12, 0.52);
  const homeL = interpolatePoint(0.85, 0.52);

  // 상단열(Q-P) 중심선 계산
  const topQ = interpolatePoint(0.12, 0.30);
  const topP = interpolatePoint(0.85, 0.30);

  // 하단열(Z-M) 중심선 계산
  const botZ = interpolatePoint(0.14, 0.74);
  const botM = interpolatePoint(0.70, 0.74);

  const currentSeqConfig = seqStep < 4 ? SEQ_STEPS[seqStep] : null;
  const currentDetectedTip = getDetectedFingertip(currentSeqConfig?.handHint);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card calibration-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-badge" style={{ width: '32px', height: '32px', fontSize: '15px' }}>
              <Crosshair size={18} />
            </div>
            <div>
              <h2 className="modal-title">키보드 위치 캘리브레이션 & 까딱임 방지 설정</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                웹캠 영상 위에 실제 키보드 위치를 맞추어 오운지 및 허공 까딱임 오감지를 차단합니다.
              </p>
            </div>
          </div>
          <button className="btn btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: 2-Column Grid */}
        <div className="calibration-layout-grid">
          {/* Left Column: Interactive Video & Grid Overlay */}
          <div className="calibration-video-panel">
            <div className="calibration-video-wrapper" ref={containerRef}>
              {/* 실시간 웹캠 비디오 */}
              <video
                ref={videoRef}
                className="calibration-webcam-video"
                playsInline
                muted
                autoPlay
              />

              {/* 카메라 꺼짐 오버레이 */}
              {!cameraActive && (
                <div className="calib-camera-off-overlay">
                  <Camera size={32} color="var(--text-muted)" />
                  <p style={{ margin: 0, lineHeight: 1.4 }}>
                    카메라가 꺼져 있습니다.<br />
                    키보드 위치를 맞추려면 카메라를 켜주세요.
                  </p>
                  {onToggleCamera && (
                    <button className="btn btn-primary" onClick={() => onToggleCamera()}>
                      <Camera size={14} />
                      <span>카메라 켜기</span>
                    </button>
                  )}
                </div>
              )}

              <div className="video-inner-guide">
                <svg ref={svgRef} className="calibration-svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* 키보드 외곽 다각형 영역 */}
                  <polygon
                    points={`
                      ${corners.topLeft.x * 100},${corners.topLeft.y * 100} 
                      ${corners.topRight.x * 100},${corners.topRight.y * 100} 
                      ${corners.bottomRight.x * 100},${corners.bottomRight.y * 100} 
                      ${corners.bottomLeft.x * 100},${corners.bottomLeft.y * 100}
                    `}
                    fill="rgba(59, 130, 246, 0.08)"
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth="0.8"
                    strokeDasharray="2 1"
                  />

                  {/* Q-P 상단열 가이드 라인 */}
                  <line
                    x1={topQ.x * 100} y1={topQ.y * 100}
                    x2={topP.x * 100} y2={topP.y * 100}
                    stroke="rgba(244, 63, 94, 0.6)"
                    strokeWidth="0.6"
                  />

                  {/* A-L 홈열(기본자리) 핵심 가이드 라인 (강조) */}
                  <line
                    x1={homeA.x * 100} y1={homeA.y * 100}
                    x2={homeL.x * 100} y2={homeL.y * 100}
                    stroke="rgba(16, 185, 129, 0.9)"
                    strokeWidth="1.0"
                  />

                  {/* Z-M 하단열 가이드 라인 */}
                  <line
                    x1={botZ.x * 100} y1={botZ.y * 100}
                    x2={botM.x * 100} y2={botM.y * 100}
                    stroke="rgba(234, 179, 8, 0.6)"
                    strokeWidth="0.6"
                  />

                  {/* 10개 열 분할선 (Perspective Grid) */}
                  {[0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85].map((uVal, idx) => {
                    const pTop = interpolatePoint(uVal, 0);
                    const pBot = interpolatePoint(uVal, 1);
                    return (
                      <line
                        key={`col-${idx}`}
                        x1={pTop.x * 100} y1={pTop.y * 100}
                        x2={pBot.x * 100} y2={pBot.y * 100}
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="0.3"
                      />
                    );
                  })}

                  {/* 주요 기준 키 마커 원 & 텍스트 */}
                  {[
                    { label: 'Q', p: interpolatePoint(0.12, 0.30), color: '#f43f5e' },
                    { label: 'P', p: interpolatePoint(0.85, 0.30), color: '#d946ef' },
                    { label: 'A', p: homeA, color: '#10b981' },
                    { label: 'L', p: homeL, color: '#8b5cf6' },
                    { label: 'Z', p: interpolatePoint(0.14, 0.74), color: '#f43f5e' },
                    { label: 'M', p: interpolatePoint(0.70, 0.74), color: '#3b82f6' },
                  ].map(k => (
                    <g key={k.label}>
                      <circle cx={k.p.x * 100} cy={k.p.y * 100} r="1.8" fill={k.color} />
                      <text
                        x={k.p.x * 100}
                        y={k.p.y * 100 - 2.5}
                        fontSize="2.8"
                        fontWeight="bold"
                        fill="#ffffff"
                        textAnchor="middle"
                      >
                        {k.label}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* 4개 인터랙티브 드래그 핸들 핀 (수동 드래그 탭에서 활성화) */}
                {activeTab === 'drag' && cornerHandles.map(handle => (
                  <div
                    key={handle.key}
                    className={`calib-corner-pin ${draggingCorner === handle.key ? 'dragging' : ''}`}
                    style={{
                      left: `${handle.pos.x * 100}%`,
                      top: `${handle.pos.y * 100}%`,
                      borderColor: handle.color
                    }}
                    onPointerDown={e => handlePointerDown(handle.key, e)}
                  >
                    <div className="pin-dot" style={{ backgroundColor: handle.color }} />
                    <div className="pin-tooltip">
                      <strong>{handle.label}</strong>
                      <span>{handle.hint}</span>
                    </div>
                  </div>
                ))}

                {/* 순차 검지 타건 모드 - 현재 타겟 위치 펄스 링 */}
                {activeTab === 'seqIndex' && currentSeqConfig && (
                  <div
                    className="seq-target-pulse-ring"
                    style={{
                      left: `${interpolatePoint(currentSeqConfig.defaultUv.u, currentSeqConfig.defaultUv.v).x * 100}%`,
                      top: `${interpolatePoint(currentSeqConfig.defaultUv.u, currentSeqConfig.defaultUv.v).y * 100}%`,
                      borderColor: currentSeqConfig.color
                    }}
                  >
                    <div className="seq-pulse-inner" style={{ backgroundColor: currentSeqConfig.color }}>
                      {currentSeqConfig.label}
                    </div>
                  </div>
                )}

                {/* 실시간 감지된 검지 끝 십자선 (Crosshair Cursor) */}
                {currentDetectedTip && (
                  <div
                    className="detected-index-pointer"
                    style={{
                      left: `${currentDetectedTip.x * 100}%`,
                      top: `${currentDetectedTip.y * 100}%`
                    }}
                  >
                    <div className="index-pointer-ring" />
                    <span className="index-pointer-label">검지 감지</span>
                  </div>
                )}

                {/* 카운트다운 오버레이 (8손가락 모드) */}
                {countdown !== null && (
                  <div className="calib-countdown-overlay">
                    <div className="countdown-number">{countdown}</div>
                    <p>ASDF — JKL; 기본자리에 손을 가만히 유지하세요!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="calib-video-footer">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeTab === 'seqIndex' && '💡 검지손가락 하나만 펴서 화면에 표시된 키를 순서대로 하나씩 콕 눌러주세요.'}
                {activeTab === 'drag' && '💡 4개 모서리 원형 핀을 드래그하여 실제 물리 키보드 모서리에 맞춰주세요.'}
                {activeTab === 'autorow' && '💡 양손을 기본자리(ASDF-JKL;)에 올린 채 버튼을 누르세요.'}
              </span>
            </div>
          </div>

          {/* Right Column: Methods, Sensitivity & Live Strike HUD */}
          <div className="calibration-controls-panel">
            {/* Mode Switch Tabs */}
            <div className="calib-tab-group">
              <button
                className={`calib-tab-btn ${activeTab === 'seqIndex' ? 'active' : ''}`}
                onClick={() => setActiveTab('seqIndex')}
              >
                <MousePointerClick size={15} />
                <span>검지 순차 타건 (추천)</span>
              </button>
              <button
                className={`calib-tab-btn ${activeTab === 'drag' ? 'active' : ''}`}
                onClick={() => setActiveTab('drag')}
              >
                <Crosshair size={15} />
                <span>4점 수동 드래그</span>
              </button>
              <button
                className={`calib-tab-btn ${activeTab === 'autorow' ? 'active' : ''}`}
                onClick={() => setActiveTab('autorow')}
              >
                <Hand size={15} />
                <span>8손가락 일괄 측정</span>
              </button>
            </div>

            {/* TAB 1: 검지 순차 터치 측정 섹션 (User Requested) */}
            {activeTab === 'seqIndex' && (
              <div className="seq-calibration-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="var(--primary)" />
                    <strong style={{ fontSize: '0.9rem' }}>검지 하나 펴고 순차 타건</strong>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                    {seqStep >= 4 ? '측정 완료 4/4' : `진행 단계 ${seqStep + 1} / 4`}
                  </span>
                </div>

                {/* 4단계 스텝 배지 바 */}
                <div className="seq-step-progress-row">
                  {SEQ_STEPS.map((s, idx) => {
                    const isDone = seqStep > idx;
                    const isCurrent = seqStep === idx;
                    return (
                      <div
                        key={s.keyName}
                        className={`seq-step-pill ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                      >
                        <div className="step-num-circle">
                          {isDone ? <Check size={12} /> : idx + 1}
                        </div>
                        <span className="step-key-name">{s.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* 현재 스텝 안내 카드 */}
                {currentSeqConfig ? (
                  <div className="seq-current-instruction">
                    <div className="seq-guide-header">
                      <div className="seq-target-badge" style={{ backgroundColor: currentSeqConfig.color }}>
                        {currentSeqConfig.label}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {currentSeqConfig.handHint}로 <strong style={{ color: currentSeqConfig.color }}>[{currentSeqConfig.label}]</strong> 키를 누르세요
                        </h4>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {currentSeqConfig.subLabel}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '8px 0 0 0' }}>
                      {currentSeqConfig.guideText}
                    </p>

                    <div className="seq-tip-status">
                      <span style={{ fontSize: '0.75rem', color: currentDetectedTip ? 'var(--success)' : 'var(--warning)' }}>
                        {currentDetectedTip ? '✅ 검지 손가락 감지 중 (키를 누르면 자동 캡처)' : '⚠️ 검지가 화면에 잘 보이게 올려주세요'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="seq-complete-banner">
                    <CheckCircle2 size={24} color="var(--success)" />
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        4개 기준 키 측정이 모두 완료되었습니다!
                      </strong>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        아래 [설정 저장 및 적용]을 눌러 연습을 시작하세요.
                      </p>
                    </div>
                  </div>
                )}

                {seqStatusMessage && (
                  <div className={`calib-toast ${seqStatusMessage.type}`} style={{ marginTop: '8px' }}>
                    <span>{seqStatusMessage.text}</span>
                  </div>
                )}

                {seqStep > 0 && (
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '10px', fontSize: '0.78rem', padding: '6px' }}
                    onClick={() => {
                      setSeqStep(0);
                      setCapturedSeqPoints({});
                      setSeqStatusMessage({ type: 'info', text: '1단계 [ Q ] 키부터 다시 측정합니다.' });
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>1단계부터 다시 측정</span>
                  </button>
                )}
              </div>
            )}

            {/* TAB 3: 8손가락 일괄 측정 섹션 */}
            {activeTab === 'autorow' && (
              <div className="autorow-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} color="var(--primary)" />
                  <strong style={{ fontSize: '0.88rem' }}>8손가락(A-L) 홈 포지션 1초 자동 피팅</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>
                  양손을 키보드 기본 자리(왼손: <strong>ASDF</strong>, 오른손: <strong>JKL;</strong>)에 올려놓은 상태에서 아래 버튼을 누르면 전체 키보드 영역이 자동으로 보정됩니다.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={startAutoCalibration}
                  disabled={countdown !== null}
                >
                  <Zap size={16} />
                  <span>{countdown !== null ? `측정 중... (${countdown})` : 'A·S·D·F — J·K·L·; 자동 측정 시작'}</span>
                </button>

                {autoCalibMessage && (
                  <div className={`calib-toast ${autoCalibMessage.type}`}>
                    <span>{autoCalibMessage.text}</span>
                  </div>
                )}
              </div>
            )}

            {/* Strike Sensitivity Tuning */}
            <div className="sensitivity-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={15} color="var(--text-primary)" />
                  <span style={{ fontSize: '0.86rem', fontWeight: '600' }}>까딱임 오감지 방지 감도</span>
                </div>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                  {SENSITIVITY_PRESETS[sensitivityLevel]?.name.split(' ')[0]}
                </span>
              </div>

              <div className="sensitivity-preset-buttons">
                {(Object.values(SENSITIVITY_PRESETS) as SensitivityPreset[]).map(preset => (
                  <button
                    key={preset.id}
                    className={`preset-btn ${sensitivityLevel === preset.id ? 'active' : ''}`}
                    onClick={() => setSensitivityLevel(preset.id)}
                  >
                    <span className="preset-name">{preset.name}</span>
                    <span className="preset-desc">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Key Strike HUD Tester */}
            <div className="strike-tester-card">
              <div className="tester-header">
                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>실시간 타건 테스트</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>키보드를 직접 눌러보세요!</span>
              </div>

              {testStrike ? (
                <div className="test-strike-hud">
                  <div className="strike-key-badge">
                    <span className="strike-code">{testStrike.code}</span>
                    <span className="strike-char">[{testStrike.key}]</span>
                  </div>

                  <div className="strike-details">
                    <div className="detail-row">
                      <span className="label">담당 손가락:</span>
                      <span className="val" style={{ color: testStrike.expectedFinger?.color }}>
                        {testStrike.expectedFinger?.name || '없음'}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="label">감지 손가락:</span>
                      <span className="val" style={{ color: testStrike.detectedFinger?.color }}>
                        {testStrike.detectedFinger?.name || '감지 대기'}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="label">키보드 영역:</span>
                      {testStrike.spatialEvaluation?.isClose ? (
                        <span className="val success">✅ 정상 위치 일치</span>
                      ) : (
                        <span className="val warning">⚠️ 영역 벗어남</span>
                      )}
                    </div>

                    {/* 타건 강도 게이지 */}
                    <div className="strike-gauge-container">
                      <div className="gauge-label">
                        <span>타건 속도(Velocity)</span>
                        <span>{Math.round(testStrike.velocity * 100) / 100}</span>
                      </div>
                      <div className="gauge-bar-bg">
                        <div
                          className="gauge-bar-fill"
                          style={{
                            width: `${Math.min(100, (testStrike.velocity / 0.5) * 100)}%`,
                            backgroundColor: testStrike.velocity > 0.25 ? 'var(--success)' : 'var(--warning)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="strike-tester-empty">
                  <p>모달이 열린 상태에서 키보드의 아무 키(예: Q, A, Z, P, L, M)나 눌러보세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={handleReset}>
            <RotateCcw size={14} />
            <span>기본값 초기화</span>
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              <CheckCircle2 size={16} />
              <span>설정 저장 및 적용</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
