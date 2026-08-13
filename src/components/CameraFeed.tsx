import React, { useState, useEffect, useRef } from 'react';
import { Camera, Sparkles, VideoOff, Settings2, RefreshCw, Crosshair } from 'lucide-react';
import { HandTracker } from '../modules/handTracker';

export interface CameraFeedProps {
  trackerRef: React.MutableRefObject<HandTracker | null>;
  cameraActive: boolean;
  onToggleCamera: (videoEl?: HTMLVideoElement | null, canvasEl?: HTMLCanvasElement | null, deviceId?: string | null) => Promise<void> | void;
  onOpenCalibration?: () => void;
  handCount?: number;
}

export default function CameraFeed({
  trackerRef,
  cameraActive,
  onToggleCamera,
  onOpenCalibration,
  handCount = 0
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    return localStorage.getItem('typingsense_selected_camera') || '';
  });

  // 사용 가능한 카메라 디바이스 목록 조회
  const updateDeviceList = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);

      // 선택된 ID가 없거나 유효하지 않으면 첫 번째 장치 선택
      if (videoDevices.length > 0) {
        const exists = videoDevices.some(d => d.deviceId === selectedDeviceId);
        if (!exists || !selectedDeviceId) {
          const defaultId = videoDevices[0].deviceId;
          setSelectedDeviceId(defaultId);
          localStorage.setItem('typingsense_selected_camera', defaultId);
        }
      }
    } catch (err) {
      console.warn('디바이스 목록 조회 실패:', err);
    }
  };

  useEffect(() => {
    updateDeviceList();

    const handleDeviceChange = () => {
      updateDeviceList();
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, []);

  useEffect(() => {
    if (trackerRef.current && videoRef.current && canvasRef.current) {
      trackerRef.current.setElements(videoRef.current, canvasRef.current);
    }
  });

  // 카메라 시작 / 전환
  const handleStart = async (deviceIdToUse = selectedDeviceId) => {
    await onToggleCamera(videoRef.current, canvasRef.current, deviceIdToUse);
    setTimeout(updateDeviceList, 500);
  };

  // 드롭다운에서 카메라 변경 시
  const handleDeviceSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    localStorage.setItem('typingsense_selected_camera', newDeviceId);

    if (cameraActive && trackerRef.current) {
      try {
        await trackerRef.current.startCamera(videoRef.current, canvasRef.current, newDeviceId);
      } catch (err) {
        console.error('카메라 전환 실패:', err);
      }
    }
  };

  return (
    <div className="camera-card">
      <div className="camera-header">
        <div className="camera-title">
          <Sparkles size={16} color="var(--primary)" />
          <span>AI 손가락 트래커</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenCalibration && (
            <button
              onClick={onOpenCalibration}
              title="키보드 영역 캘리브레이션"
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 7px',
                fontSize: '0.72rem',
                color: 'var(--primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Crosshair size={12} />
              <span>영역 설정</span>
            </button>
          )}
          <div className={`camera-status-dot ${cameraActive ? 'active' : ''}`} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {cameraActive ? (handCount > 0 ? `${handCount}개 손` : '확인 중...') : '꺼짐'}
          </span>
        </div>
      </div>

      {/* 카메라 장치 선택 드롭다운 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface-elevated)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
        <Settings2 size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <select
          value={selectedDeviceId}
          onChange={handleDeviceSelect}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.78rem',
            color: 'var(--text-primary)',
            width: '100%',
            cursor: 'pointer',
            textOverflow: 'ellipsis'
          }}
        >
          {devices.length === 0 && <option value="">기본 카메라</option>}
          {devices.map((device, index) => (
            <option key={device.deviceId || index} value={device.deviceId} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
              {device.label || `카메라 ${index + 1}`}
            </option>
          ))}
        </select>
        <button
          onClick={updateDeviceList}
          title="카메라 목록 새로고침"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '2px' }}
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="video-container" style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          className="webcam-video"
          playsInline
          muted
          autoPlay
          style={{
            opacity: cameraActive ? 1 : 0,
            transition: 'opacity 0.2s ease'
          }}
        />
        <canvas
          ref={canvasRef}
          className="tracking-canvas"
          width={320}
          height={240}
          style={{
            opacity: cameraActive ? 1 : 0,
            pointerEvents: 'none'
          }}
        />

        {!cameraActive && (
          <div
            className="camera-placeholder"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f1117',
              zIndex: 5
            }}
          >
            <VideoOff size={28} color="var(--text-muted)" style={{ marginBottom: '4px' }} />
            <p style={{ fontSize: '0.82rem', lineHeight: '1.4', marginBottom: '8px' }}>
              웹캠으로 손을 찍으면<br />
              실시간 운지법을 검증합니다.
            </p>
            <button className="btn btn-primary" onClick={() => handleStart()}>
              <Camera size={14} />
              <span>카메라 켜기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
