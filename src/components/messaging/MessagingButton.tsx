import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '@constants/index';

interface MessagingButtonProps {
  unreadCount?: number;
  variant?: 'icon' | 'button';
}

export const MessagingButton: React.FC<MessagingButtonProps> = ({ unreadCount = 0, variant = 'icon' }) => {
  if (variant === 'icon') {
    return (
      <Link to={ROUTES.MESSAGING} style={{ textDecoration: 'none', position: 'relative' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: 'rgba(79,70,229,0.1)',
            border: '1px solid rgba(79,70,229,0.2)',
            borderRadius: 8,
            padding: 10,
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          💬
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                minWidth: 20,
                height: 20,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </motion.button>
      </Link>
    );
  }

  return (
    <Link to={ROUTES.MESSAGING} style={{ textDecoration: 'none' }}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 16px',
          cursor: 'pointer',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        💬 Messages
        {unreadCount > 0 && (
          <div
            style={{
              minWidth: 20,
              height: 20,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </motion.button>
    </Link>
  );
};

export default MessagingButton;
