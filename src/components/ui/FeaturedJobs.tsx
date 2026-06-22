import React from 'react';
import { motion } from 'framer-motion';

const jobs = [
  { id: 1, title: 'Senior Frontend Engineer', company: 'Nebula Labs', salary: '$110k', location: 'Remote', skills: ['React', 'TypeScript'] },
  { id: 2, title: 'Backend Engineer', company: 'Atlas Systems', salary: '$95k', location: 'Bengaluru', skills: ['Node', 'Postgres'] },
  { id: 3, title: 'Product Designer', company: 'Arc Studio', salary: '$85k', location: 'Remote', skills: ['Figma', 'UX'] },
];

export const FeaturedJobs: React.FC = () => {
  return (
    <section style={{ padding: '24px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Featured Jobs</h3>
          <div style={{ color: 'var(--color-text-secondary)' }}>Curated picks for you</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
          {jobs.map((j) => (
            <motion.div whileHover={{ y: -8, boxShadow: '0 30px 60px rgba(15,23,42,0.08)' }} key={j.id} className="glass-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{j.title}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{j.company} · {j.location}</div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{j.salary}</div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {j.skills.map((s) => (
                  <div key={s} style={{ padding: '6px 8px', background: 'rgba(79,70,229,0.06)', borderRadius: 10, fontWeight: 700, fontSize: 12 }}>{s}</div>
                ))}
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ padding: '8px 12px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(15,23,42,0.06)', fontWeight: 700 }}>Apply</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobs;
