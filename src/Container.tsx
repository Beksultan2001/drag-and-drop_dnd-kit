import { FC } from 'react';
import { UniqueIdentifier, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from './SortableItem';

const Container: FC<{ items: { id: UniqueIdentifier }[]; id: string }> = ({
  items,
  id,
}) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="droppable-container">
      <SortableContext
        items={items.map(item => item.id)} // Pass only IDs for sortable context
        strategy={verticalListSortingStrategy}
        id={id} // Optional, if not provided, dnd-kit will auto assign
      >
        <div className="droppable-container__sortable-wrapper" ref={setNodeRef}>
          {items.map(item => (
            <SortableItem key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default Container;
