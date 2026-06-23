import { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { PipelineEntry, fetchPipelineByJob, moveCandidate, PipelineStage } from '../../services/pipeline';
import CandidateCard from './CandidateCard';
import './pipeline.css';

const STAGES: PipelineStage[] = [
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Sent',
  'Hired',
  'Rejected'
];

interface Props {
  jobId?: string;
}

export default function PipelineBoard({ jobId }: Props) {
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<Record<PipelineStage, 'asc' | 'desc'>>(() => {
    const orders = {} as Record<PipelineStage, 'asc' | 'desc'>;
    STAGES.forEach((stage) => {
      orders[stage] = 'desc';
    });
    return orders;
  });
  const [columns, setColumns] = useState<Record<PipelineStage, PipelineEntry[]>>(() => {
    const map = {} as Record<PipelineStage, PipelineEntry[]>;
    STAGES.forEach(s => (map[s] = []));
    return map;
  });

  const sortedColumns = useMemo(() => {
    const results: Record<PipelineStage, PipelineEntry[]> = {} as any;
    STAGES.forEach((stage) => {
      const list = columns[stage] || [];
      results[stage] = [...list].sort((a, b) => {
        const aDate = new Date(a.updated_at).getTime();
        const bDate = new Date(b.updated_at).getTime();
        return sortOrder[stage] === 'asc' ? aDate - bDate : bDate - aDate;
      });
    });
    return results;
  }, [columns, sortOrder]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchPipelineByJob(jobId || '')
      .then(data => {
        if (!mounted) return;
        const grouped: Record<PipelineStage, PipelineEntry[]> = {} as any;
        STAGES.forEach(s => (grouped[s] = []));
        data.forEach(item => {
          const stage = item.stage as PipelineStage;
          if (!grouped[stage]) grouped[stage] = [];
          grouped[stage].push(item);
        });
        setColumns(grouped);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const toggleSortOrder = (stage: PipelineStage) => {
    setSortOrder((prev) => ({
      ...prev,
      [stage]: prev[stage] === 'asc' ? 'desc' : 'asc',
    }));
  };

  const onDragEnd = async (result: DropResult): Promise<void> => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const fromStage = source.droppableId as PipelineStage;
    const toStage = destination.droppableId as PipelineStage;
    if (fromStage === toStage) return;

    const originalSource = columns[fromStage];
    const originalDest = columns[toStage];
    const sourceList = Array.from(originalSource);
    const destList = Array.from(originalDest);
    const [moved] = sourceList.splice(source.index, 1);
    destList.splice(destination.index, 0, moved);

    setColumns(prev => ({ ...prev, [fromStage]: sourceList, [toStage]: destList }));

    try {
      await moveCandidate(draggableId, toStage);
    } catch (err) {
      console.error(err);
      setColumns(prev => ({ ...prev, [fromStage]: originalSource, [toStage]: originalDest }));
    }
  };

  if (loading) {
    return <div className="pipeline-loading">Loading pipeline...</div>;
  }

  return (
    <div className="pipeline-board">
      <DragDropContext onDragEnd={onDragEnd}>
        {STAGES.map(stage => (
          <Droppable droppableId={stage} key={stage}>
            {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`pipeline-column ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
              >
                <div className="pipeline-column-header">
                  <div>
                    <h4>{stage}</h4>
                    <button
                      type="button"
                      className="pipeline-sort-button"
                      onClick={() => toggleSortOrder(stage)}
                    >
                      Sort: {sortOrder[stage] === 'asc' ? 'Oldest' : 'Newest'}
                    </button>
                  </div>
                  <span className="count">{sortedColumns[stage]?.length ?? 0}</span>
                </div>
                <div className="pipeline-column-body">
                  {sortedColumns[stage] && sortedColumns[stage].length === 0 && (
                    <div className="empty">No candidates</div>
                  )}
                  {sortedColumns[stage]?.map((candidate, idx) => (
                    <Draggable draggableId={candidate.id} index={idx} key={candidate.id}>
                      {(provided: DraggableProvided, _snapshot: DraggableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{ ...provided.draggableProps.style }}
                        >
                          <CandidateCard candidate={candidate} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </DragDropContext>
    </div>
  );
}
