import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { messagingService } from '@services/messaging';
import { useAuthStore } from '@store/index';

interface StartMessageProps {
  candidateId: string;
  candidateName: string;
  onMessageStarted?: () => void;
}

export const StartMessage: React.FC<StartMessageProps> = ({
  candidateId,
  candidateName,
  onMessageStarted,
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const handleStart = async () => {
    if (!message.trim() || !user) return;

    try {
      setLoading(true);
      await messagingService.sendMessage(
        user.id,
        candidateId,
        message,
        undefined,
        'recruiter'
      );
      setMessage('');
      onMessageStarted?.();
    } catch (error) {
      console.error('Failed to start message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card"
      style={{ padding: 20 }}
    >
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontWeight: 800 }}>Message {candidateName}</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 4 }}>
          Start a conversation with this candidate
        </p>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message here..."
        style={{
          width: '100%',
          minHeight: 100,
          padding: 12,
          borderRadius: 8,
          border: '1px solid rgba(15,23,42,0.06)',
          fontFamily: 'inherit',
          resize: 'vertical',
          marginBottom: 12,
        }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleStart}
          disabled={!message.trim() || loading}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: !message.trim() || loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </motion.div>
  );
};

export default StartMessage;
