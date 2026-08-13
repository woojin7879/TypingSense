import React, { useEffect } from 'react';
import { Award, RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TypingStats } from '../types';

export interface StatsModalProps {
  isOpen: boolean;
  stats: TypingStats | null;
  onRetry: () => void;
  onNext: () => void;
  onClose: () => void;
}

export default function StatsModal({ isOpen, stats, onRetry, onNext, onClose }: StatsModalProps) {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen || !stats) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={24} color="var(--primary)" />
            <h2 className="modal-title">타이핑 완료!</h2>
          </div>
        </div>

        <div className="hud-stats-row">
          <div className="stat-box">
            <span className="stat-label">최종 타수 (CPM)</span>
            <span className="stat-value highlight">{stats.cpm}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">속도 (WPM)</span>
            <span className="stat-value">{stats.wpm}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">타자 정확도</span>
            <span className="stat-value">{stats.accuracy}%</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">운지법 준수율</span>
            <span className="stat-value success">{stats.fingeringAccuracy}%</span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <CheckCircle2 size={18} color="var(--success)" />
            <strong style={{ fontSize: '0.95rem' }}>
              {stats.fingeringAccuracy >= 90 ? '완벽한 10손가락 운지법입니다!' : '꾸준한 연습으로 정석 운지법을 완성해보세요!'}
            </strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            잘못된 손가락으로 누른 횟수: <strong>{stats.fingerErrors || 0}회</strong>
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-secondary" onClick={onRetry}>
            <RotateCcw size={16} />
            <span>다시 연습</span>
          </button>
          <button className="btn btn-primary" onClick={onNext}>
            <span>다음 문장으로</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
