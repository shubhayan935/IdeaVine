// src/contexts/NodeOperationsContext.tsx

import React, { createContext, ReactNode, useCallback } from 'react';
import { Node, Edge, addEdge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { useUserInfo } from '../context/UserContext';
import { useParams } from 'react-router-dom';

interface CustomNodeData {
  title: string;
  content: string;
  parents: string[];
  children: string[];
  depth: number;
  isHighlighted?: boolean;
}

interface NodeOperationsContextProps {
  addNodeToDB: (parentId: string, position: 'top' | 'bottom' | 'left' | 'right') => Promise<void>;
  updateNodeInDB: (node: Partial<CustomNodeData>) => Promise<void>;
  deleteNodeFromDB: (nodeId: string) => Promise<void>;
}

export const NodeOperationsContext = createContext<NodeOperationsContextProps | undefined>(undefined);

interface NodeOperationsProviderProps {
  children: ReactNode;
  nodes: Node<CustomNodeData>[];
  setNodes: React.Dispatch<React.SetStateAction<Node<CustomNodeData>[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const NodeOperationsProvider = ({
  children,
  nodes,
  setNodes,
  edges,
  setEdges,
}: NodeOperationsProviderProps) => {
  const { mindmap_id } = useParams<{ mindmap_id: string }>();
  const { userEmail } = useUserInfo();
  const { toast } = useToast();

  const addNodeToDB = useCallback(
    async (parentId: string, position: 'top' | 'bottom' | 'left' | 'right') => {
      try {
        const newNodeId = uuidv4();
        const parentNode = nodes.find(node => node.id === parentId);

        if (!parentNode) {
          throw new Error('Parent node not found.');
        }
        const newNode: Node<CustomNodeData> = {
          id: newNodeId,
          type: 'customNode',
          data: {
            title: 'New Node',
            content: '',
            parents: [parentId],
            children: [],
            depth: parentNode.data.depth + 1,
          },
          position: {
            x: parentNode.position.x + (position === 'left' ? -200 : position === 'right' ? 200 : 0),
            y: parentNode.position.y + (position === 'bottom' ? 100 : position === 'top' ? -100 : 0),
          },
        };

        setNodes((nds) => [...nds, newNode]);

        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === parentId) {
              return {
                ...node,
                data: { ...node.data, children: [...node.data.children, newNodeId] },
              };
            }
            return node;
          })
        );

        const newEdge: Edge = {
          id: uuidv4(),
          source: parentId,
          target: newNodeId,
        };

        setEdges((eds) => addEdge(newEdge, eds));

        const response = await fetch(`http://127.0.0.1:5000/mindmaps/${mindmap_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            "nodes_to_add":[{
              _id: newNodeId,
              mindmap_id: mindmap_id,
              user_email: userEmail,
              title: newNode.data.title,
              content: newNode.data.content,
              position: newNode.position,
              parents: newNode.data.parents,
              children: newNode.data.children,
              depth: newNode.data.depth,
            }]
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add node to the database.');
        }

      } catch (error: any) {
        console.error("Error adding node:", error);
        toast({
          title: "Add Node Failed",
          description: error.message || "There was an error adding the node. Please try again.",
          variant: "destructive",
        });
      }
    },
    [mindmap_id, nodes, setNodes, setEdges, userEmail, toast]
  );

  const updateNodeInDB = useCallback(
    async (node: Partial<CustomNodeData>) => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/mindmaps/${mindmap_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            "nodes_to_update": [{
              node_id: node.id,
              type: 'customNode',
              title: node.title,
              content: node.content,
              parents: node.parents,
              children: node.children,
              position: node.position,
              depth: node.depth,
            }]
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update node in the database.');
        }

        toast({
          title: "Node Updated",
          description: "The node has been successfully updated.",
        });
      } catch (error: any) {
        console.error("Error updating node:", error);
        toast({
          title: "Update Node Failed",
          description: error.message || "There was an error updating the node. Please try again.",
          variant: "destructive",
        });
      }
    },
    [mindmap_id, toast]
  );

  const deleteNodeFromDB = useCallback(
    async (nodeId: string) => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/mindmaps/${mindmap_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({"nodes_to_delete": [nodeId]}),
        });

        if (!response.ok) {
          throw new Error('Failed to delete node from the database.');
        }

        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));

        toast({
          title: "Node Deleted",
          description: "The node has been successfully deleted.",
        });
      } catch (error: any) {
        console.error("Error deleting node:", error);
        toast({
          title: "Delete Node Failed",
          description: error.message || "There was an error deleting the node. Please try again.",
          variant: "destructive",
        });
      }
    },
    [mindmap_id, setNodes, setEdges, toast]
  );

  return (
    <NodeOperationsContext.Provider value={{ addNodeToDB, updateNodeInDB, deleteNodeFromDB }}>
      {children}
    </NodeOperationsContext.Provider>
  );
};
