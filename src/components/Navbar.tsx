import React from 'react';
import { Camera, Volume2, VolumeX, ShieldAlert, ShieldCheck, Sun, Moon, HelpCircle, Monitor, Laptop, Crosshair } from 'lucide-react';

export interface NavbarProps {
  osMode: 'mac' | 'win';
  setOsMode: React.Dispatch<React.SetStateAction<'mac' | 'win'>>;
  strictMode: boolean;
  setStrictMode: React.Dispatch<React.SetStateAction<boolean>>;
  soundEnabled: boolean;
  toggleSound: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onOpenGuide: () => void;
  onOpenCalibration: () => void;
  cameraActive: boolean;
  onToggleCamera: () => void;
}

export default function Navbar({
  osMode,
  setOsMode,
  strictMode,
  setStrictMode,
  soundEnabled,
  toggleSound,
  theme,
  toggleTheme,
  onOpenGuide,
  onOpenCalibration,
  cameraActive,
  onToggleCamera
}: NavbarProps) {
  return (
    <header className="app-header">
      <div className="brand-area">
        <div className="logo-badge">TS</div>
        <div>
          <h1 className="brand-title">
            TypingSense
            <span className="brand-badge">AI Fingering Tutor</span>
          </h1>
        </div>
      </div>

      <div className="nav-actions">
        {/* Strict Mode Toggle */}
        <button
          className={`btn ${strictMode ? 'btn-active' : 'btn-secondary'}`}
          onClick={() => setStrictMode(!strictMode)}
          title={strictMode ? '엄격 모드: 오운지 시 타자 완전 차단' : '자유 모드: 타자 허용 & 통계 기록'}
        >
          {strictMode ? <ShieldAlert size={16} color="var(--primary)" /> : <ShieldCheck size={16} />}
          <span>{strictMode ? '엄격 차단 모드' : '코칭 모드'}</span>
        </button>

        {/* Mac / Windows Layout Toggle */}
        <button
          className="btn btn-secondary"
          onClick={() => setOsMode(osMode === 'mac' ? 'win' : 'mac')}
          title="키보드 레이아웃 전환 (Mac / Windows)"
        >
          {osMode === 'mac' ? <Laptop size={16} /> : <Monitor size={16} />}
          <span>{osMode === 'mac' ? 'Mac 배열' : 'Windows 배열'}</span>
        </button>

        {/* Camera Toggle */}
        <button
          className={`btn ${cameraActive ? 'btn-active' : 'btn-secondary'}`}
          onClick={onToggleCamera}
          title="웹캠 AI 손가락 인식 켜기/끄기"
        >
          <Camera size={16} />
          <span>{cameraActive ? '카메라 On' : '카메라 시작'}</span>
        </button>

        {/* Keyboard Spatial Calibration Button */}
        <button
          className="btn btn-secondary"
          onClick={onOpenCalibration}
          title="키보드 위치 캘리브레이션 및 까딱임 방지 설정"
          style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
        >
          <Crosshair size={16} />
          <span>키보드 영역 설정</span>
        </button>

        {/* Sound Toggle */}
        <button
          className="btn btn-icon"
          onClick={toggleSound}
          title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Theme Toggle */}
        <button
          className="btn btn-icon"
          onClick={toggleTheme}
          title="다크/라이트 테마 전환"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Help Guide */}
        <button
          className="btn btn-icon"
          onClick={onOpenGuide}
          title="운지법 가이드 및 카메라 팁"
        >
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
}
