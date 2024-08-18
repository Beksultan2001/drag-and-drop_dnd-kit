import { useEffect, type FC } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classnames from 'classnames';


export const Item: FC<{
  item: { id: UniqueIdentifier };  // Updated to accept item object
  isDragging?: boolean;
  isOverlay?: boolean;
}> = ({ item, isDragging = false, isOverlay = false }) => {
  return (
    <div
      className={classnames('sortable-item', {
        'sortable-item--is-overlay': isOverlay,
        'sortable-item--is-dragging': isDragging,
      })}
    >
      {item.id}  {/* Display item id */}
    </div>
  );
};
const SortableItem: FC<{ item: { id: UniqueIdentifier } }> = ({ item }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    // Debugging purpose
    // console.log(transform, 'transform', CSS.Transform.toString(transform))
  }, [transform]);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Item item={item} isDragging={isDragging} />
    </div>
  );
};

export default SortableItem;