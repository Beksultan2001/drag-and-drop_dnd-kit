import './styles/index.scss';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import classnames from 'classnames';
import type {
  UniqueIdentifier,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  CollisionDetection,
} from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import Container from './Container';
import { Item } from './SortableItem';
import { ItemType } from './ItemType';

const App = () => {

  const [items, setItems] = useState<Record<string, ItemType[]>>({
    container1: [{id: 1, data: {isSpace: 1}}, {id: 2, data: {isSpace: 0}}, {id: 3, data: {isSpace: 1}}],
    container2: [{id: 4, data: {isSpace: 0}}, {id: 5, data: {isSpace: 1}}, {id: 6, data: {isSpace: 1}}],
    container3: [{id: 7, data: {isSpace: 1}}, {id: 8, data: {isSpace: 0}}, {id: 9, data: {isSpace: 1}}],
    container4: [{id: 10, data: {isSpace: 0}},{id: 11,data: {isSpace: 1}}, {id: 12, data: {isSpace: 1}}],
  });

  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        // Require mouse to move 5px to start dragging, this allow onClick to be triggered on click
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        // Require mouse to move 5px to start dragging, this allow onClick to be triggered on click
        tolerance: 5,
        // Require to press for 100ms to start dragging, this can reduce the chance of dragging accidentally due to page scroll
        delay: 100,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // activeId - used for displaying DragOverlay
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  const findContainer = (id: UniqueIdentifier) => {
    if (id in items) {
      return id;
    }

    return Object.keys(items).find((key) => items[key].some((t) => t.id === id));
  };

  const itemsBeforeDrag = useRef<null | Record<string, ItemType[]>>(
    null,
  );

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      itemsBeforeDrag.current = {
        container1: [...items.container1],
        container2: [...items.container2],
        container3: [...items.container3],
        container4: [...items.container4],
      };
      setActiveId(active.id);
    },
    [items],
  );

  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over || active.id in items) {
        return;
      }

      const { id: activeId } = active;
      const { id: overId } = over;

      const activeContainer = findContainer(activeId);
      const overContainer = findContainer(overId);

      if (!overContainer || !activeContainer) {
        return;
      }

      if (activeContainer !== overContainer) {
        setItems((items) => {
          const activeItems = items[activeContainer];
          const overItems = items[overContainer];
          const overIndex = overItems.findIndex((item) => item.id === overId);
          const activeIndex = activeItems.findIndex((item) => item.id === activeId);

          let newIndex: number;

          // This if might not be needed for non-nested container
          // if (overId in items) {
          //   newIndex = overItems.length + 1;
          // } else {
          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top >
              over.rect.top + over.rect.height;

          const modifier = isBelowOverItem ? 1 : 0;

          // eslint-disable-next-line prefer-const
          newIndex =
            overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
          // }

          recentlyMovedToNewContainer.current = true;

          return {
            ...items,
            [activeContainer]: items[activeContainer].filter(
              (item) => item.id !== active.id,
            ),
            [overContainer]: [
              ...items[overContainer].slice(0, newIndex),
              items[activeContainer][activeIndex],
              ...items[overContainer].slice(
                newIndex,
                items[overContainer].length,
              ),
            ],
          };
        });
      }
    },
    [items, findContainer],
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      const activeContainer = findContainer(active.id);
      if (!over || !activeContainer) {
        setActiveId(null);
        return;
      }

      const { id: activeId } = active;
      const { id: overId } = over;

      const overContainer = findContainer(overId);

      if (!overContainer) {
        setActiveId(null);
        return;
      }

      const activeIndex = items[activeContainer].findIndex((item) => item.id === activeId);
      const overIndex = items[overContainer].findIndex((item) => item.id === overId);

      if (activeIndex !== overIndex) {
        setItems((items) => ({
          ...items,
          [overContainer]: arrayMove(
            items[overContainer],
            activeIndex,
            overIndex,
          ),
        }));
      }
      setActiveId(null);
    },
    [items, findContainer],
  );

  // When pressing ESC key
  const onDragCancel = useCallback(() => {
    setItems({
      container1: [...(itemsBeforeDrag.current?.container1 ?? [])],
      container2: [...(itemsBeforeDrag.current?.container2 ?? [])],
      container3: [...(itemsBeforeDrag.current?.container3 ?? [])],
      container4: [...(itemsBeforeDrag.current?.container4 ?? [])],
    });
    itemsBeforeDrag.current = null;
    setActiveId(null);
  }, []);

  /**
   * Custom collision detection strategy optimized for multiple containers
   * - First, find any droppable containers intersecting with the pointer.
   * - If there are none, find intersecting containers with the active draggable.
   * - If there are no intersecting containers, return the last matched intersection
   */
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      if (activeId && activeId in items) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            (container) => container.id in items,
          ),
        });
      }

      // Start by finding any intersecting droppable
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? // If there are droppables intersecting with the pointer, return those
            pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, 'id');

      if (overId != null) {
        if (overId in items) {
          const containerItems = items[overId];

          // If a container is matched and it contains items (columns 'A', 'B', 'C')
          if (containerItems.length > 0) {
            // Return the closest droppable within that container
            overId = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) =>
                  container.id !== overId &&
                  // containerItems.includes(container.id),
                  containerItems.some((t) => t.id === container.id)
              ),
            })[0]?.id;
          }
        }

        lastOverId.current = overId;

        return [{ id: overId }];
      }

      // When a draggable item moves to a new container, the layout may shift
      // and the `overId` may become `null`. We manually set the cached `lastOverId`
      // to the id of the draggable item that was moved to the new container, otherwise
      // the previous `overId` will be returned which can cause items to incorrectly shift positions
      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      // If no droppable is matched, return the last match
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId, items],
  );

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  }, [items]);

  return (
    <>
      <div
        className={classnames('wrapper', {
          'wrapper--horizontal': true,
        })}
      >
        <DndContext
          sensors={sensors}
          // collisionDetection={closestCenter}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={onDragCancel}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
          // When overlay is not used, items can be drag and scroll to bottom infinitely,
          // restrictToWindowEdges can solve some the issue.
          // However, since the draggable item is bound inside window, it will sometimes prevent
          // dragging of tall items to top of container. Enabling this also won't
          // solve infinite scroll on non-body container (e.g. overflow-x on a child div)
          // modifiers={[restrictToWindowEdges]}
        >
          <Container id="container1" items={items.container1} />
          <Container id="container2" items={items.container2} />
          <Container id="container3" items={items.container3} />
          <Container id="container4" items={items.container4} />

          {/* Use CSS.Translate.toString(transform) in `Item` style if overlay is disabled */}
          {/* <DragOverlay>
            {activeId ? <Item id={String(activeId)} isOverlay /> : null}
          </DragOverlay> */}
        </DndContext>
      </div>
    </>
  );
};

export default App;
