import { Timestamp } from 'firebase/firestore';

export type NodeType = 'folder' | 'note';

export interface Node {
  id: string;
  parentId: string | null;
  name: string;
  type: NodeType;
  order: number;
  content: string;
  color?: string;
  icon?: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
