import type { FC } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classnames from 'classnames';
import type { ItemType } from './ItemType';

export const Item: FC<{
  id: UniqueIdentifier;
  isDragging?: boolean;
  isOverlay?: boolean;
  data?: Record<string, unknown>
}> = ({ id, isDragging = false, isOverlay = false, data = {} }) => {

  return (
    <div
      className={classnames('sortable-item', {
        'sortable-item--is-overlay': isOverlay,
        'sortable-item--is-dragging': isDragging, // Apply dragging styling if isDragging prop is true
      })}
    >
      {data.isSpace ? '' : id}
    </div>
  );
};

const SortableItem: FC<{ id: UniqueIdentifier, data: ItemType["data"]}> = ({ id, data }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id, disabled: data.isSpace === 0});

  const style = {
    // Use Translate instead of Transform if overlay is disabled
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Item id={id} isDragging={isDragging} data={data} />
    </div>
  );
};

export default SortableItem;
