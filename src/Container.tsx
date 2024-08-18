import type { FC } from 'react';
import { useDroppable } from '@dnd-kit/core';
// import type { UniqueIdentifier } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import SortableItem from './SortableItem';
import { ItemType } from './ItemType';

const Container: FC<{ items: ItemType[]; id: string }> = ({
  items,
  id,
}) => {
  // This is needed for empty column to be droppable
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="droppable-container">
      <SortableContext
        items={items}
        strategy={verticalListSortingStrategy}
        id={id} // Optional, if not provided, dnd-kit will auto assign
      >
        <div className="droppable-container__sortable-wrapper" ref={setNodeRef}>
          {items.map((item: ItemType) => (
            <SortableItem key={id} id={item.id} data={item.data} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default Container;
