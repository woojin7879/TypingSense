import React from 'react';
import { X, Camera } from 'lucide-react';
import { FINGERS } from '../modules/keyboardLayout';

export interface FingerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FingerGuideModal({ isOpen, onClose }: FingerGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">10손가락 표준 운지법 & 카메라 설정 가이드</h2>
          <button className="btn btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', lineHeight: '1.6' }}>
          {/* 웹캠 설치 팁 */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
              <Camera size={16} />
              카메라 배치 팁 (최고의 인식률)
            </h3>
            <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>노트북 웹캠</strong>: 노트북 화면을 살짝 아래로 기울여 키보드와 양손이 화면에 보이게 맞춥니다.</li>
              <li><strong>스마트폰/외장 웹캠</strong>: 모니터 위나 사선 거치대에 두고 손등과 손가락이 잘 보이도록 합니다.</li>
              <li>밝은 조명 아래에서 손가락이 뚜렷할수록 AI 인식 정확도가 올라갑니다.</li>
            </ul>
          </div>

          {/* 10손가락 담당 키 매핑 표 */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '10px' }}>
              손가락별 기본 담당 키 매핑
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.values(FINGERS).map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderLeft: `4px solid ${f.color}`
                  }}
                >
                  <strong style={{ color: f.color, fontSize: '0.85rem' }}>{f.name}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {f.id === 'L_PINKY' && 'Q, A, Z, 1, Tab'}
                    {f.id === 'L_RING' && 'W, S, X, 2'}
                    {f.id === 'L_MIDDLE' && 'E, D, C, 3'}
                    {f.id === 'L_INDEX' && 'R, T, F, G, V, B, 4, 5'}
                    {f.id === 'THUMB' && 'Spacebar'}
                    {f.id === 'R_INDEX' && 'Y, U, H, J, N, M, 6, 7'}
                    {f.id === 'R_MIDDLE' && 'I, K, ,, 8'}
                    {f.id === 'R_RING' && 'O, L, ., 9'}
                    {f.id === 'R_PINKY' && 'P, ;, /, 0, Enter'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn btn-primary" onClick={onClose}>
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
}
