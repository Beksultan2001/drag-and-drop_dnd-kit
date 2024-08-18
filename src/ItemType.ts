import type {
    UniqueIdentifier,
  } from '@dnd-kit/core';

export interface ItemType {
    id: UniqueIdentifier,
    data: {
        isSpace: number
    }
}