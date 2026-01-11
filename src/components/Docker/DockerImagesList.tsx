"use client";

import { Table, Group, Stack, Text, Code, ActionIcon, Tooltip, Pagination, Card, Badge } from "@mantine/core";
import { IconLayersDifference } from "@tabler/icons-react";
import { useState } from "react";
import type { DockerImage } from "@/lib/client";
import { formatBytes } from "@/lib/format";
import { ImageLayersModal } from "./ImageLayersModal";
import { DockerImageActions } from "./DockerImageActions";
import Link from "next/link";

interface DockerImagesListProps {
  images: DockerImage[];
}

export function DockerImagesList({ images }: DockerImagesListProps) {
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedImageTags, setSelectedImageTags] = useState<string[]>([]);

  // Pagination
  const totalPages = Math.ceil(images.length / itemsPerPage);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedImages = images.slice(startIndex, startIndex + itemsPerPage);

  const handleViewLayers = (image: DockerImage) => {
    setSelectedImageId(image.id);
    setSelectedImageTags(image.tags || []);
    setModalOpen(true);
  };

  const rows = paginatedImages.map((image) => (
    <Table.Tr key={image.id}>
      <Table.Td>
        <Stack gap={4}>
            {(image.tags && image.tags.length > 0) ? (
                image.tags.map(tag => (
                    <Text key={tag} fw={500} size="sm">{tag}</Text>
                ))
            ) : (
                <Text c="dimmed" size="sm">&lt;none&gt;</Text>
            )}
        </Stack>
      </Table.Td>
      <Table.Td>
        <Code>{image.id.substring(7, 19)}</Code>
      </Table.Td>
      <Table.Td>
        {formatBytes(image.size)}
      </Table.Td>
      <Table.Td>
        {new Date(image.created).toLocaleString()}
      </Table.Td>
      <Table.Td>
        {image.containers && image.containers.length > 0 ? (
          <Group gap={4}>
            {image.containers.map((container) => (
              <Badge
                key={container.id}
                component={Link}
                href={`/docker/containers/${container.id}`}
                variant="light"
                color="blue"
                style={{ cursor: "pointer" }}
              >
                {container.name}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text c="dimmed" size="sm">
            -
          </Text>
        )}
      </Table.Td>
       <Table.Td>
         <Group gap={8}>
            <Tooltip label="View Layers">
                <ActionIcon variant="light" color="blue" onClick={() => handleViewLayers(image)}>
                    <IconLayersDifference size={16} />
                </ActionIcon>
            </Tooltip>
            <DockerImageActions imageId={image.id} imageTags={image.tags || []} />
         </Group>
       </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
        <Stack gap="md">
        <Card withBorder shadow="sm" radius="md">
        <Table>
            <Table.Thead>
            <Table.Tr>
                <Table.Th>Repository:Tag</Table.Th>
                <Table.Th>Image ID</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Containers</Table.Th>
                <Table.Th>Actions</Table.Th>
            </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
        </Table>
        </Card>
        
        {totalPages > 1 && (
            <Group justify="center">
            <Pagination total={totalPages} value={activePage} onChange={setActivePage} />
            </Group>
        )}
        </Stack>

        <ImageLayersModal 
            opened={modalOpen} 
            onClose={() => setModalOpen(false)} 
            imageId={selectedImageId}
            imageTags={selectedImageTags}
        />
    </>
  );
}
