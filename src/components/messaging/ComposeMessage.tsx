import React, { useState, useRef } from 'react';
import { messagingService } from '@services/messaging';

interface ComposeMessageProps {
  conversationId: string;
  onSend: (content: string, attachments?: string[]) => void;
}

export const ComposeMessage: React.FC<ComposeMessageProps> = ({ conversationId, onSend }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;

    try {
      await onSend(message, attachments);
      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await messagingService.uploadAttachment(file, conversationId);
        setAttachments((prev) => [...prev, url]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {attachments.map((attach, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(79,70,229,0.06)',
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              <span>📎 {attach.split('/').pop()}</span>
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-accent)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            background: 'rgba(79,70,229,0.1)',
            border: '1px solid rgba(79,70,229,0.2)',
            borderRadius: 8,
            padding: '10px 12px',
            cursor: 'pointer',
            fontWeight: 700,
            color: 'var(--color-primary)',
          }}
        >
          {uploading ? '📤' : '📎'}
        </button>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(15,23,42,0.06)',
            fontFamily: 'inherit',
            resize: 'none',
            minHeight: 40,
            maxHeight: 100,
          }}
        />

        <button
          onClick={handleSend}
          disabled={!message.trim() && attachments.length === 0}
          style={{
            background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: !message.trim() && attachments.length === 0 ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ComposeMessage;
