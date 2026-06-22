import React from 'react';
import { motion } from 'framer-motion';

const categories = ['Frontend', 'Backend', 'Full Stack', 'UI/UX', 'DevOps', 'Data Science'];

export const CategoryGrid: React.FC = () => {
  return (
    <section style={{ padding: '36px 0' }}>
      <div className="container">
        <motion.h3 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Popular Categories</motion.h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 18 }}>Explore opportunities by category</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
          {categories.map((c) => (
            <motion.div whileHover={{ y: -8, scale: 1.02 }} key={c} className="glass-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#EEF2FF,#F8FAFC)' }} />
              <div style={{ fontWeight: 700 }}>{c}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
