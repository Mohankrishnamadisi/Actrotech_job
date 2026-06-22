import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const PremiumNavbar: React.FC = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.45))',
        borderBottom: '1px solid rgba(15,23,42,0.04)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,var(--color-primary),var(--color-secondary))', boxShadow: '0 8px 28px rgba(79,70,229,0.16)' }} />
          <div style={{ fontWeight: 800, color: 'var(--color-dark)', fontSize: 18 }}>Actro</div>
        </Link>

        <nav style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <Link to="/jobs" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Find Jobs</Link>
          <Link to="/companies" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Companies</Link>
          <Link to="/remote" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Remote Jobs</Link>
          <Link to="/resources" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Resources</Link>
          <Link to="/about" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600 }}>About</Link>
        </nav>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
          <Link to="/signup" style={{ padding: '8px 14px', borderRadius: 999, background: 'linear-gradient(90deg,var(--color-primary),var(--color-secondary))', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>Register</Link>
          <Link to="/post-job" style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(15,23,42,0.06)', textDecoration: 'none', color: 'var(--color-dark)', fontWeight: 700 }}>Post Job</Link>
        </div>
      </div>
    </motion.header>
  );
};

export default PremiumNavbar;
