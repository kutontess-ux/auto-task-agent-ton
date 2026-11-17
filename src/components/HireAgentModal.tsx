import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { HireAgentInput } from '../types/agent';

interface HireAgentModalProps {
  onClose: () => void;
  onHire: (input: HireAgentInput) => void;
}

const COLOR_OPTIONS = ['#ec4899', '#f97316', '#eab308', '#14b8a6', '#6366f1', '#ef4444'];

export const HireAgentModal: React.FC<HireAgentModalProps> = ({ onClose, onHire }) => {
  const [name, setName] = useState('');
  const [roleLabel, setRoleLabel] = useState('Designer');
  const [specialty, setSpecialty] = useState('Thiết kế giao diện UI/UX và tối ưu trải nghiệm người dùng');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onHire({ name, roleLabel, specialty, color });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div className="pixel-panel" style={{ width: 'min(400px, 94vw)', maxHeight: '90vh', overflowY: 'auto', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div className="font-pixel" style={{ fontSize: '12px', color: '#fbbf24' }}>
            TUYỂN AGENT MỚI
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
              Tên Agent
            </label>
            <input
              type="text"
              required
              placeholder="VD: Sora, Pixel, Orion..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#0d1117',
                border: '1px solid #303a4d',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
              Vai trò (Role)
            </label>
            <input
              type="text"
              required
              placeholder="VD: UI Designer, Data Analyst, DevOps..."
              value={roleLabel}
              onChange={(e) => setRoleLabel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#0d1117',
                border: '1px solid #303a4d',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
              Kỹ năng chuyên môn
            </label>
            <textarea
              rows={2}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#0d1117',
                border: '1px solid #303a4d',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
                resize: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
              Màu áo nhân vật
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: c,
                    border: color === c ? '3px solid #ffffff' : '2px solid #303a4d',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button type="button" className="pixel-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="pixel-btn pixel-btn-primary">
              <UserPlus size={14} />
              Thêm vào văn phòng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
