import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import CameraFeed from './components/CameraFeed';
import TypingArea from './components/TypingArea';
import VirtualKeyboard from './components/VirtualKeyboard';
import FingerGuideModal from './components/FingerGuideModal';
import KeyboardCalibrationModal from './components/KeyboardCalibrationModal';
import StatsModal from './components/StatsModal';
import { PRACTICE_CATEGORIES } from './data/practiceContents';
import { HandTracker } from './modules/handTracker';
import { soundManager } from './modules/soundManager';
import { fingeringEngine } from './modules/fingeringEngine';
import { Grid3x3, Type, Train, BookOpen, Code2, LucideIcon } from 'lucide-react';
import { HandData, KeyMappingInfo, MotionState, TypingStats } from './types';

const ICON_MAP: Record<string, LucideIcon> = {
  Grid3x3,
  Type,
  Train,
  BookOpen,
  Code2
};

export default function App() {
  // OS 자동 감지 (Mac or Windows)
  const [osMode, setOsMode] = useState<'mac' | 'win'>(() => {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    return isMac ? 'mac' : 'win';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [strictMode, setStrictMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [guideModalOpen, setGuideModalOpen] = useState<boolean>(false);
  const [calibrationModalOpen, setCalibrationModalOpen] = useState<boolean>(false);
  const [statsModalOpen, setStatsModalOpen] = useState<boolean>(false);
  const [lastStats, setLastStats] = useState<TypingStats | null>(null);

  // 연습 카테고리 및 레슨 선택
  const [activeCategoryId, setActiveCategoryId] = useState<string>('position');
  const [activeLessonId, setActiveLessonId] = useState<string>(PRACTICE_CATEGORIES[0].items[0].id);

  // 키보드 & 손가락 상태
  const [targetKeyInfo, setTargetKeyInfo] = useState<KeyMappingInfo | null>(null);
  const [pressedKeyCode, setPressedKeyCode] = useState<string | null>(null);
  const [errorKeyCode, setErrorKeyCode] = useState<string | null>(null);

  // 손가락 추적 데이터
  const [handsData, setHandsData] = useState<HandData[]>([]);
  const [motionState, setMotionState] = useState<MotionState>({});
  const trackerRef = useRef<HandTracker | null>(null);

  // 테마 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Strict 모드 동기화
  useEffect(() => {
    fingeringEngine.strictMode = strictMode;
  }, [strictMode]);

  // 타겟 키 변경 시 손가락 트래커에 타겟 전달
  useEffect(() => {
    if (trackerRef.current && targetKeyInfo) {
      trackerRef.current.setTargetFinger(targetKeyInfo.finger);
    }
  }, [targetKeyInfo]);

  // HandTracker 인스턴스 준비
  useEffect(() => {
    const tracker = new HandTracker(null, null, (hands, motion) => {
      setHandsData(hands);
      setMotionState(motion);
    });
    trackerRef.current = tracker;

    return () => {
      tracker.stopCamera();
    };
  }, []);

  // 카메라 토글 및 장치 지정
  const handleToggleCamera = async (videoEl: HTMLVideoElement | null = null, canvasEl: HTMLCanvasElement | null = null, deviceId: string | null = null) => {
    if (!trackerRef.current) return;

    if (cameraActive) {
      trackerRef.current.stopCamera();
      setCameraActive(false);
      setHandsData([]);
    } else {
      try {
        const targetDeviceId = deviceId || localStorage.getItem('typingsense_selected_camera') || null;
        await trackerRef.current.startCamera(videoEl, canvasEl, targetDeviceId);
        setCameraActive(true);
      } catch (err) {
        console.error('카메라 에러:', err);
        alert('웹캠을 켤 수 없습니다. 브라우저의 카메라 권한이 허용되어 있는지 확인해주세요.');
      }
    }
  };

  const toggleSound = () => {
    const newState = soundManager.toggleSound();
    setSoundEnabled(newState);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const currentCategory = PRACTICE_CATEGORIES.find(c => c.id === activeCategoryId) || PRACTICE_CATEGORIES[0];
  const currentLesson = currentCategory.items.find(item => item.id === activeLessonId) || currentCategory.items[0];

  // 레슨 완료 핸들러
  const handleLessonComplete = (stats: TypingStats) => {
    setLastStats(stats);
    setStatsModalOpen(true);
  };

  // 다음 레슨 이동
  const handleNextLesson = () => {
    setStatsModalOpen(false);
    const currentIndex = currentCategory.items.findIndex(i => i.id === activeLessonId);
    if (currentIndex < currentCategory.items.length - 1) {
      setActiveLessonId(currentCategory.items[currentIndex + 1].id);
    } else {
      const catIdx = PRACTICE_CATEGORIES.findIndex(c => c.id === activeCategoryId);
      const nextCat = PRACTICE_CATEGORIES[(catIdx + 1) % PRACTICE_CATEGORIES.length];
      setActiveCategoryId(nextCat.id);
      setActiveLessonId(nextCat.items[0].id);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        osMode={osMode}
        setOsMode={setOsMode}
        strictMode={strictMode}
        setStrictMode={setStrictMode}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenGuide={() => setGuideModalOpen(true)}
        onOpenCalibration={() => setCalibrationModalOpen(true)}
        cameraActive={cameraActive}
        onToggleCamera={() => handleToggleCamera()}
      />

      {/* Practice Category & Lesson Selector */}
      <section className="practice-selector">
        <div className="category-tabs">
          {PRACTICE_CATEGORIES.map((cat) => {
            const IconComp = ICON_MAP[cat.icon] || Grid3x3;
            const isActive = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                className={`category-tab ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setActiveLessonId(cat.items[0].id);
                }}
              >
                <IconComp size={16} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        <div className="item-chips">
          {currentCategory.items.map((item) => (
            <button
              key={item.id}
              className={`item-chip ${item.id === activeLessonId ? 'active' : ''}`}
              onClick={() => setActiveLessonId(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
      </section>

      {/* Main Grid: Typing Stage & Camera/AI Panel */}
      <main className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Typing Area */}
          <TypingArea
            currentLesson={currentLesson}
            handsData={handsData}
            motionState={motionState}
            strictMode={strictMode}
            onLessonComplete={handleLessonComplete}
            setTargetKeyInfo={setTargetKeyInfo}
            setPressedKeyCode={setPressedKeyCode}
            setErrorKeyCode={setErrorKeyCode}
          />

          {/* Virtual Keyboard */}
          <VirtualKeyboard
            targetKeyInfo={targetKeyInfo}
            pressedKeyCode={pressedKeyCode}
            errorKeyCode={errorKeyCode}
            osMode={osMode}
          />
        </div>

        {/* Side Panel: Camera Feed & AI Tracking */}
        <aside className="side-panel">
          <CameraFeed
            trackerRef={trackerRef}
            cameraActive={cameraActive}
            onToggleCamera={handleToggleCamera}
            onOpenCalibration={() => setCalibrationModalOpen(true)}
            handCount={handsData.length}
          />
        </aside>
      </main>

      {/* Modals */}
      <FingerGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />

      <KeyboardCalibrationModal
        isOpen={calibrationModalOpen}
        onClose={() => setCalibrationModalOpen(false)}
        handsData={handsData}
        motionState={motionState}
        trackerRef={trackerRef}
        cameraActive={cameraActive}
        onToggleCamera={() => handleToggleCamera()}
      />

      <StatsModal
        isOpen={statsModalOpen}
        stats={lastStats}
        onRetry={() => setStatsModalOpen(false)}
        onNext={handleNextLesson}
        onClose={() => setStatsModalOpen(false)}
      />
    </div>
  );
}
