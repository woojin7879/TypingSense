/**
 * MediaPipe Hands 기반 실시간 손 및 손가락 관절 추적 모듈 (TypeScript)
 */
import { FINGERS } from './keyboardLayout';
import { spatialEngine } from './spatialEngine';
import { FingerId, HandData, LandmarkPoint, MotionFinger, MotionState } from '../types';

export const FINGER_TIPS: Record<string, number> = {
  THUMB: 4,
  INDEX: 8,
  MIDDLE: 12,
  RING: 16,
  PINKY: 20
};

export const FINGER_JOINTS: Record<string, number[]> = {
  THUMB: [1, 2, 3, 4],
  INDEX: [5, 6, 7, 8],
  MIDDLE: [9, 10, 11, 12],
  RING: [13, 14, 15, 16],
  PINKY: [17, 18, 19, 20]
};

interface FrameSnapshot {
  timestamp: number;
  fingers: Record<string, LandmarkPoint & { flexion: number }>;
}

export type OnHandsUpdateCallback = (handsData: HandData[], motionState: MotionState) => void;

interface MediaPipeResults {
  multiHandLandmarks?: LandmarkPoint[][];
  multiHandedness?: Array<{ label: 'Left' | 'Right'; score: number }>;
}

interface MediaPipeHandsInstance {
  setOptions: (options: { maxNumHands?: number; modelComplexity?: number; minDetectionConfidence?: number; minTrackingConfidence?: number }) => void;
  onResults: (callback: (results: MediaPipeResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
}

export class HandTracker {
  private video: HTMLVideoElement | null;
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private onHandsUpdate?: OnHandsUpdateCallback;

  private handsModel: MediaPipeHandsInstance | null = null;
  public isRunning: boolean = false;
  public lastHandsData: HandData[] = [];
  private historyBuffer: FrameSnapshot[] = [];
  private historyMaxLength: number = 10;
  public targetFinger: FingerId | null = null;
  public activeFingers: Set<string> = new Set();

  constructor(
    videoElement: HTMLVideoElement | null,
    canvasElement: HTMLCanvasElement | null,
    onHandsUpdate?: OnHandsUpdateCallback
  ) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
    this.onHandsUpdate = onHandsUpdate;
  }

  public getStream(): MediaStream | null {
    if (this.video && this.video.srcObject) {
      return this.video.srcObject as MediaStream;
    }
    return null;
  }

  public setElements(video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null): void {
    this.video = video;
    this.canvas = canvas;
    if (canvas) {
      this.ctx = canvas.getContext('2d');
    }
  }

  public async initHandsModel(): Promise<boolean> {
    if (this.handsModel) return true;

    try {
      // 1. window.Hands CDN 또는 dynamic import 확인
      let HandsLib = (window as unknown as { Hands: new (options: { locateFile: (file: string) => string }) => MediaPipeHandsInstance }).Hands;
      if (!HandsLib) {
        const mod = await import('@mediapipe/hands');
        HandsLib = (mod as unknown as { Hands: typeof HandsLib }).Hands || (window as unknown as { Hands: typeof HandsLib }).Hands;
      }

      if (!HandsLib) {
        throw new Error('MediaPipe Hands 라이브러리를 로드할 수 없습니다.');
      }

      this.handsModel = new HandsLib({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.handsModel.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.handsModel.onResults((results) => this.processResults(results));
      console.log('MediaPipe Hands 모델 초기화 성공');
      return true;
    } catch (err) {
      console.error('MediaPipe Hands 초기화 오류:', err);
      return false;
    }
  }

  public async startCamera(videoElement: HTMLVideoElement | null, canvasElement: HTMLCanvasElement | null, deviceId: string | null = null): Promise<boolean> {
    if (videoElement) this.video = videoElement;
    if (canvasElement) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');
    }

    if (this.video && this.video.srcObject) {
      const tracks = (this.video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }

    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        deviceId: deviceId ? { exact: deviceId } : undefined
      },
      audio: false
    };

    try {
      console.log('카메라 스트림 요청 중... (deviceId:', deviceId, ')');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.video) {
        this.video.srcObject = stream;
        await this.video.play().catch(e => console.warn('Video auto-play catch:', e));
      }
      this.isRunning = true;

      this.initHandsModel().then(() => {
        if (this.isRunning) {
          this.runDetectionLoop();
        }
      });

      return true;
    } catch (err) {
      console.error('카메라 시작 실패:', err);
      this.isRunning = false;
      throw err;
    }
  }

  public stopCamera(): void {
    this.isRunning = false;
    if (this.video && this.video.srcObject) {
      const tracks = (this.video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.lastHandsData = [];
    if (this.onHandsUpdate) {
      this.onHandsUpdate([], {});
    }
  }

  public async runDetectionLoop(): Promise<void> {
    if (!this.isRunning) return;

    if (this.video && this.video.readyState >= 2 && this.handsModel) {
      try {
        await this.handsModel.send({ image: this.video });
      } catch (e) {
        // 프레임 전송 실패 시 무시하고 다음 프레임 진행
      }
    }

    if (this.isRunning) {
      requestAnimationFrame(() => this.runDetectionLoop());
    }
  }

  private processResults(results: MediaPipeResults): void {
    const timestamp = performance.now();
    const rawHandsList: Array<{ landmarks: LandmarkPoint[]; score: number }> = [];

    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i];
        rawHandsList.push({
          landmarks,
          score: handedness?.score ?? 0.9
        });
      }
    }

    // 공간 및 해부학적 구조 기반 완벽한 왼손/오른손 판별
    const handsData: HandData[] = this.classifyHandSides(rawHandsList);

    this.updateMotionBuffer(handsData, timestamp);
    this.lastHandsData = handsData;

    this.drawSkeleton(handsData);

    if (this.onHandsUpdate) {
      this.onHandsUpdate(handsData, this.getMotionState());
    }
  }

  /**
   * 타이핑 환경(키보드 위 손등 노출)에 맞춘 100% 신뢰성 높은 왼손/오른손 분류
   */
  private classifyHandSides(rawHands: Array<{ landmarks: LandmarkPoint[]; score: number }>): HandData[] {
    if (rawHands.length === 0) return [];

    if (rawHands.length === 1) {
      const h = rawHands[0];
      const avgMirroredX = h.landmarks.reduce((acc, lm) => acc + (1 - lm.x), 0) / h.landmarks.length;
      const thumbX = 1 - (h.landmarks[4]?.x ?? 0.5);
      const pinkyX = 1 - (h.landmarks[20]?.x ?? 0.5);

      let hand: 'Left' | 'Right';
      if (avgMirroredX < 0.42) {
        hand = 'Left';
      } else if (avgMirroredX > 0.58) {
        hand = 'Right';
      } else {
        // 손등이 위를 향한 타건 자세에서 왼손 엄지는 새끼보다 오른쪽에 위치(thumbX > pinkyX)
        hand = (thumbX > pinkyX) ? 'Left' : 'Right';
      }

      return [{ hand, score: h.score, landmarks: h.landmarks }];
    }

    // 2개 손이 감지된 경우: 미러링된 화면 기준 왼쪽(작은 X)에 있는 손이 무조건 왼손!
    const hand0AvgX = rawHands[0].landmarks.reduce((acc, lm) => acc + (1 - lm.x), 0) / rawHands[0].landmarks.length;
    const hand1AvgX = rawHands[1].landmarks.reduce((acc, lm) => acc + (1 - lm.x), 0) / rawHands[1].landmarks.length;

    if (hand0AvgX <= hand1AvgX) {
      return [
        { hand: 'Left', score: rawHands[0].score, landmarks: rawHands[0].landmarks },
        { hand: 'Right', score: rawHands[1].score, landmarks: rawHands[1].landmarks }
      ];
    } else {
      return [
        { hand: 'Right', score: rawHands[0].score, landmarks: rawHands[0].landmarks },
        { hand: 'Left', score: rawHands[1].score, landmarks: rawHands[1].landmarks }
      ];
    }
  }

  private updateMotionBuffer(handsData: HandData[], timestamp: number): void {
    const frameSnapshot: FrameSnapshot = {
      timestamp,
      fingers: {}
    };

    handsData.forEach(h => {
      const prefix = h.hand === 'Left' ? 'L_' : 'R_';
      const lm = h.landmarks;

      Object.entries(FINGER_TIPS).forEach(([name, tipIdx]) => {
        const fingerId = name === 'THUMB' ? 'THUMB' : `${prefix}${name}`;
        const tipLandmark = lm[tipIdx];
        const mcpLandmark = lm[tipIdx - 3];

        if (tipLandmark) {
          frameSnapshot.fingers[fingerId] = {
            x: 1 - tipLandmark.x, // 미러링된 화면/키보드 영역과 1:1 일치하는 X좌표
            y: tipLandmark.y,
            z: tipLandmark.z,
            flexion: tipLandmark.y - (mcpLandmark ? mcpLandmark.y : 0)
          };
        }
      });
    });

    this.historyBuffer.push(frameSnapshot);
    if (this.historyBuffer.length > this.historyMaxLength) {
      this.historyBuffer.shift();
    }
  }

  public getMotionState(): MotionState {
    if (this.historyBuffer.length < 2) return {};

    const latest = this.historyBuffer[this.historyBuffer.length - 1];
    const prev = this.historyBuffer[0];
    const dt = (latest.timestamp - prev.timestamp) / 1000;

    if (dt <= 0) return {};

    const motion: MotionState = {};
    Object.keys(latest.fingers).forEach(fId => {
      if (prev.fingers[fId]) {
        const dy = latest.fingers[fId].y - prev.fingers[fId].y;
        const dz = (latest.fingers[fId].z || 0) - (prev.fingers[fId].z || 0);
        const velocityY = dy / dt;
        
        motion[fId] = {
          velocityY,
          dz,
          currentPos: latest.fingers[fId]
        };
      }
    });

    return motion;
  }

  public setTargetFinger(fingerId: FingerId | null): void {
    this.targetFinger = fingerId;
  }

  public drawSkeleton(handsData: HandData[]): void {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.clearRect(0, 0, width, height);

    // 0. 캘리브레이션된 키보드 영역 오버레이 그리기
    this.drawKeyboardOverlay(width, height);

    if (!handsData || handsData.length === 0) return;

    for (let i = 0; i < handsData.length; i++) {
      const h = handsData[i];
      const landmarks = h.landmarks;
      const prefix = h.hand === 'Left' ? 'L_' : 'R_';

      // 1. 관절 연결선
      this.drawHandConnections(landmarks, width, height);

      // 2. 관절 포인트
      landmarks.forEach((lm) => {
        const x = (1 - lm.x) * width;
        const y = lm.y * height;

        if (this.ctx) {
          this.ctx.beginPath();
          this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          this.ctx.fill();
        }
      });

      // 3. 손가락 끝 강조
      Object.entries(FINGER_TIPS).forEach(([fName, tipIdx]) => {
        const fingerId = (fName === 'THUMB' ? 'THUMB' : `${prefix}${fName}`) as FingerId;
        const fingerConfig = FINGERS[fingerId];
        const tipLm = landmarks[tipIdx];
        if (!tipLm || !fingerConfig || !this.ctx) return;

        const x = (1 - tipLm.x) * width;
        const y = tipLm.y * height;
        const isTarget = (this.targetFinger === fingerId);

        this.ctx.save();
        this.ctx.globalAlpha = isTarget ? 1.0 : 0.35;

        this.ctx.beginPath();
        this.ctx.arc(x, y, isTarget ? 10 : 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = fingerConfig.color;
        this.ctx.fill();
        this.ctx.lineWidth = isTarget ? 2.5 : 1;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();

        if (isTarget) {
          // 타겟 손가락: 다중 펄스 링 & 네온 발광
          this.ctx.beginPath();
          this.ctx.arc(x, y, 16 + Math.sin(Date.now() / 150) * 3, 0, 2 * Math.PI);
          this.ctx.strokeStyle = fingerConfig.color;
          this.ctx.lineWidth = 2.5;
          this.ctx.stroke();

          this.ctx.font = 'bold 12px Pretendard, sans-serif';
          this.ctx.fillStyle = '#ffffff';
          this.ctx.textAlign = 'center';
          this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          this.ctx.shadowBlur = 6;
          this.ctx.fillText(`👉 ${fingerConfig.name}`, x, y - 22);
        }

        this.ctx.restore();
      });
    }
  }

  private drawHandConnections(landmarks: LandmarkPoint[], width: number, height: number): void {
    if (!this.ctx) return;
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 1.5;

    connections.forEach(([start, end]) => {
      const p1 = landmarks[start];
      const p2 = landmarks[end];
      if (!p1 || !p2 || !this.ctx) return;

      const x1 = (1 - p1.x) * width;
      const y1 = p1.y * height;
      const x2 = (1 - p2.x) * width;
      const y2 = p2.y * height;

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    });
  }

  /**
   * 캘리브레이션된 키보드 영역 및 A-L 홈열 라인을 미러링 캔버스에 투영하여 렌더링
   */
  public drawKeyboardOverlay(width: number, height: number): void {
    if (!this.ctx || !spatialEngine || !spatialEngine.enabled) return;

    const { topLeft: TL, topRight: TR, bottomRight: BR, bottomLeft: BL } = spatialEngine.corners;

    const pTL = { x: (1 - TL.x) * width, y: TL.y * height };
    const pTR = { x: (1 - TR.x) * width, y: TR.y * height };
    const pBR = { x: (1 - BR.x) * width, y: BR.y * height };
    const pBL = { x: (1 - BL.x) * width, y: BL.y * height };

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(pTL.x, pTL.y);
    this.ctx.lineTo(pTR.x, pTR.y);
    this.ctx.lineTo(pBR.x, pBR.y);
    this.ctx.lineTo(pBL.x, pBL.y);
    this.ctx.closePath();

    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.04)';
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 2]);
    this.ctx.stroke();

    const pHomeA = spatialEngine.keyboardToCameraPoint(0.12, 0.52);
    const pHomeL = spatialEngine.keyboardToCameraPoint(0.85, 0.52);

    this.ctx.beginPath();
    this.ctx.moveTo((1 - pHomeA.x) * width, pHomeA.y * height);
    this.ctx.lineTo((1 - pHomeL.x) * width, pHomeL.y * height);
    this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    this.ctx.lineWidth = 1.2;
    this.ctx.setLineDash([2, 2]);
    this.ctx.stroke();

    this.ctx.restore();
  }
}
