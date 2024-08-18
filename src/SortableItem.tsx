import type { FC } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classnames from 'classnames';

export const Item: FC<{
  id: UniqueIdentifier;
  isDragging?: boolean;
  isOverlay?: boolean;
}> = ({ id, isDragging = false, isOverlay = false }) => {
  return (
    <div
      className={classnames('sortable-item', {
        'sortable-item--is-overlay': isOverlay,
        'sortable-item--is-dragging': isDragging, // Apply dragging styling if isDragging prop is true
      })}
    >
      {id}
    </div>
  );
};

const SortableItem: FC<{ id: UniqueIdentifier }> = ({ id }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id });

  const style = {
    // Use Translate instead of Transform if overlay is disabled
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Item id={id} isDragging={isDragging} />
    </div>
  );
};

export default SortableItem;
