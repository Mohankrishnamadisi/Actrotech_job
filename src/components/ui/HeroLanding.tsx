import React from 'react';
import { motion } from 'framer-motion';
import FloatingCard from './FloatingCard';

export const HeroLanding: React.FC = () => {
  return (
    <section style={{ padding: '64px 0' }}>
      <div className="container" style={{ display: 'flex', gap: 36, alignItems: 'center', justifyContent: 'space-between' }}>
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} style={{ flex: 1, maxWidth: 720 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <div className="pill">Premium</div>
            <div style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Startup style recruitment</div>
          </div>

          <h1 style={{ fontSize: '3.6rem', lineHeight: 1.03, margin: 0, fontWeight: 900, background: 'linear-gradient(90deg,var(--color-primary),var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'gradientShift 6s linear infinite' }}>
            Find Your
            <br />
            Dream Job
            <br />
            Today
          </h1>

          <p style={{ marginTop: 16, color: 'var(--color-text-secondary)', fontSize: 18 }}>Help candidates discover jobs and recruiters find talent faster.</p>

          <div style={{ marginTop: 26 }} className="glass-card">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16 }}>
              <input aria-label="search" placeholder="Search by job title, skill, or company" style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', fontSize: 16 }} />
              <input aria-label="location" placeholder="Location" style={{ width: 220, border: 0, outline: 'none', background: 'transparent' }} />
              <button style={{ background: 'linear-gradient(90deg,var(--color-primary),var(--color-secondary))', color: '#fff', padding: '10px 18px', borderRadius: 12, fontWeight: 800 }}>Search</button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} style={{ width: 420, position: 'relative' }}>
          <div style={{ position: 'absolute', right: -24, top: -40, width: 420, height: 320 }}>
            <svg width="420" height="320" viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0" stopColor="#EEF2FF" />
                  <stop offset="1" stopColor="#F8FAFC" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="420" height="320" rx="28" fill="url(#g1)" />
            </svg>

            <motion.div style={{ position: 'absolute', left: 20, top: 20 }} animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
              <FloatingCard title="Senior Frontend" value="$95k–$120k" />
            </motion.div>

            <motion.div style={{ position: 'absolute', left: 48, top: 140 }} animate={{ y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 0.4 }}>
              <FloatingCard title="Hiring" subtitle="12 open roles" />
            </motion.div>

            <motion.div style={{ position: 'absolute', right: 16, top: 86 }} animate={{ y: [0, -10, 0] }} transition={{ duration: 4.8, repeat: Infinity, delay: 0.8 }}>
              <FloatingCard title="Candidates" value="1.2k" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <style>{`@keyframes gradientShift { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }`}</style>
    </section>
  );
};

export default HeroLanding;
