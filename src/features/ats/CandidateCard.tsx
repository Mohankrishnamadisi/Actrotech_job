import { PipelineEntry } from '../../services/pipeline';
import { motion } from 'framer-motion';

interface Props {
  candidate: PipelineEntry;
}

export default function CandidateCard({ candidate }: Props) {
  const name = (candidate.metadata && candidate.metadata.name) || 'Unnamed Candidate';
  const title = (candidate.metadata && candidate.metadata.title) || '';

  return (
    <motion.div
      className="candidate-card"
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <div className="candidate-card-main">
        <div className="avatar" aria-hidden>
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="info">
          <div className="name">{name}</div>
          {title && <div className="title">{title}</div>}
        </div>
      </div>
      <div className="candidate-card-meta">
        <small>Updated {new Date(candidate.updated_at).toLocaleString()}</small>
      </div>
    </motion.div>
  );
}
