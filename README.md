# TypingSense (타이핑센스) ⌨️✨

> **AI 기반 실시간 웹캠 10손가락 운지법 교정 및 타자 연습 시스템**  
> 웹캠으로 손을 비추며, 정석 10손가락 운지법으로 치지 않으면 타자가 차단되는 지능형 타이핑 튜터 웹 애플리케이션입니다.

---

## 🌟 주요 기능 (Key Features)

### 1. 🤖 MediaPipe Hands 실시간 손가락 관절 추적
- 웹캠 영상을 통해 21개 손 랜드마크 및 10손가락 끝(Fingertip)의 실시간 3D 위치와 하강 속도(Velocity)를 밀리초 단위로 추적합니다.

### 2. 🎯 키보드 위치 캘리브레이션 & 공간 인식 (Spatial Calibration)
- **4점 원근 투영 (Perspective Mapping)**: 카메라 각도에 맞춰 4개 모서리 핀을 드래그하여 가상 키보드 격자를 실제 키보드 위에 1:1로 매핑합니다.
- **ASDF-JKL; 8손가락 원터치 자동 측정**: 기본 자리에 손을 올리고 3초 만에 키보드 전체 폭과 기울기를 자동 피팅합니다.
- **까딱임 오감지 방지 (Strike Threshold)**: 단순 공중 꼼지락거림이나 미세 떨림을 걸러내는 감도 튜닝 지원.

### 3. 🚫 오운지 즉각 차단 & 정밀 판정 엔진
- **엄격 차단 모드**: 올바르지 않은 손가락(예: 독수리 타법)으로 입력 시 입력을 즉시 차단하고 경고음 재생.
- **코칭 모드**: 타자는 허용하되 오운지 통계 및 실시간 피드백 토스트 표시.

### 4. ⌨️ 다양한 연습 모드 & 배열 지원
- **Mac / Windows 배열 실시간 전환**
- **5대 연습 테마**:
  - 자리 연습 (기본자리, 윗자리, 아랫자리, 숫자/기호)
  - 낱말 연습 (한글 기초, 영문 기초, IT & 개발 단어)
  - 지하철 역명 테마 (서울 2호선, 1호선, 신분당선 등)
  - 짧은 글 & 명언 (훈민정음, 서시, 스티브 잡스, 아인슈타인)
  - 개발자 코드 연습 (React Hooks, Async/Await 등)

### 5. 🎵 무지연 Web Audio API 효과음
- 외부 음원 파일 다운로드 없이 브라우저 내에서 직접 청축 기계식 클릭음, 오운지 버저음, 미션 클리어 아르페지오 사운드를 실시간 합성.

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React 18, TypeScript, Vite
- **AI & Computer Vision**: `@mediapipe/hands`, WebRTC MediaDevices API
- **Audio**: Web Audio API (Synthesizer)
- **Icons & Effects**: `lucide-react`, `canvas-confetti`
- **Styling**: Vanilla CSS Design Tokens (Dark / Light Theme 지원)

---

## 🚀 시작하기 (Getting Started)

### 설치
```bash
# 레포지토리 클론
git clone https://github.com/woojin7879/TypingSense.git
cd TypingSense

# 의존성 설치
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173`으로 접속합니다.

### 프로덕션 빌드 & 타입 검사
```bash
# 타입 검사
npm run type-check

# 프로덕션 빌드
npm run build
```

---

## 📄 라이선스 (License)
MIT License
