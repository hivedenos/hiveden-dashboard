"use client";

import { Modal, Table, Text, Code, LoadingOverlay, Stack, Group, Badge } from "@mantine/core";
import { useEffect, useState } from "react";
import { getImageLayers } from "@/actions/docker";
import type { ImageLayer } from "@/lib/client";
import { formatBytes } from "@/lib/format";

interface ImageLayersModalProps {
  opened: boolean;
  onClose: () => void;
  imageId: string | null;
  imageTags: string[];
}

export function ImageLayersModal({ opened, onClose, imageId, imageTags }: ImageLayersModalProps) {
  const [layers, setLayers] = useState<ImageLayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened && imageId) {
      setLoading(true);
      setError(null);
      // Use the first tag if available for better readability in request, otherwise ID
      getImageLayers(imageId)
        .then((response) => {
            if (response.data) {
                setLayers(response.data);
            } else {
                setLayers([]);
            }
        })
        .catch((err) => {
          console.error("Failed to fetch layers:", err);
          setError("Failed to fetch image layers.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [opened, imageId]);

  return (
    <Modal 
        opened={opened} 
        onClose={onClose} 
        title={<Text fw={700}>Layers for {imageTags[0] || imageId?.substring(0, 12)}</Text>} 
        size="xl"
    >
      <div style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
        {error ? (
          <Text c="red">{error}</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Command / Comment</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Created</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {layers.map((layer) => (
                <Table.Tr key={layer.id}>
                  <Table.Td>
                    <Code>{layer.id.substring(0, 12)}</Code>
                  </Table.Td>
                  <Table.Td style={{ maxWidth: 400, wordBreak: 'break-word' }}>
                    <Text size="sm">{layer.created_by || layer.comment}</Text>
                    {layer.tags && layer.tags.length > 0 && (
                        <Group gap={4} mt={4}>
                            {layer.tags.map(tag => <Badge key={tag} size="xs" variant="outline">{tag}</Badge>)}
                        </Group>
                    )}
                  </Table.Td>
                  <Table.Td>{formatBytes(layer.size)}</Table.Td>
                  <Table.Td>{new Date(layer.created * 1000).toLocaleString()}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </div>
    </Modal>
  );
}
