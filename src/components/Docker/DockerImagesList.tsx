"use client";

import { Table, Group, Stack, Text, Code, ActionIcon, Tooltip, Pagination, Card, Badge, Paper, TextInput, Select, SimpleGrid, ThemeIcon } from "@mantine/core";
import { IconLayersDifference, IconPhotoScan, IconSearch, IconStack2, IconTrash, IconLink } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [usageFilter, setUsageFilter] = useState<string>("all");
  const [itemsPerPage, setItemsPerPage] = useState<string>("10");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedImageTags, setSelectedImageTags] = useState<string[]>([]);

  const totalImages = images.length;
  const danglingImages = images.filter((image) => !image.tags || image.tags.length === 0).length;
  const inUseImages = images.filter((image) => image.containers && image.containers.length > 0).length;
  const unusedImages = totalImages - inUseImages;

  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      const normalizedQuery = query.trim().toLowerCase();
      const tags = image.tags || [];
      const inUse = Boolean(image.containers && image.containers.length > 0);

      const matchesQuery =
        normalizedQuery.length === 0 ||
        image.id.toLowerCase().includes(normalizedQuery) ||
        tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      const matchesUsage =
        usageFilter === "all" ||
        (usageFilter === "in_use" && inUse) ||
        (usageFilter === "unused" && !inUse) ||
        (usageFilter === "dangling" && tags.length === 0);

      return matchesQuery && matchesUsage;
    });
  }, [images, query, usageFilter]);

  // Pagination
  const perPage = parseInt(itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredImages.length / perPage));
  const startIndex = (activePage - 1) * perPage;
  const paginatedImages = filteredImages.slice(startIndex, startIndex + perPage);

  useEffect(() => {
    if (activePage > totalPages) {
      setActivePage(totalPages);
    }
  }, [activePage, totalPages]);

  const handleViewLayers = (image: DockerImage) => {
    setSelectedImageId(image.id);
    setSelectedImageTags(image.tags || []);
    setModalOpen(true);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActivePage(1);
  };

  const handleUsageFilterChange = (value: string | null) => {
    setUsageFilter(value || "all");
    setActivePage(1);
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
        <SimpleGrid cols={{ base: 2, md: 4 }}>
          <Paper withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed" tt="uppercase">Total Images</Text>
            <Group justify="space-between" mt={4}>
              <Text fw={700} size="xl">{totalImages}</Text>
              <ThemeIcon size="sm" variant="light" color="blue"><IconPhotoScan size={12} /></ThemeIcon>
            </Group>
          </Paper>
          <Paper withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed" tt="uppercase">In Use</Text>
            <Group justify="space-between" mt={4}>
              <Text fw={700} size="xl">{inUseImages}</Text>
              <ThemeIcon size="sm" variant="light" color="green"><IconLink size={12} /></ThemeIcon>
            </Group>
          </Paper>
          <Paper withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed" tt="uppercase">Unused</Text>
            <Group justify="space-between" mt={4}>
              <Text fw={700} size="xl">{unusedImages}</Text>
              <ThemeIcon size="sm" variant="light" color="yellow"><IconTrash size={12} /></ThemeIcon>
            </Group>
          </Paper>
          <Paper withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed" tt="uppercase">Dangling</Text>
            <Group justify="space-between" mt={4}>
              <Text fw={700} size="xl">{danglingImages}</Text>
              <ThemeIcon size="sm" variant="light" color="gray"><IconStack2 size={12} /></ThemeIcon>
            </Group>
          </Paper>
        </SimpleGrid>

        <Paper withBorder radius="md" p="sm">
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Group>
              <TextInput
                label="Search images"
                placeholder="Tag or image ID"
                leftSection={<IconSearch size={16} />}
                value={query}
                onChange={(event) => handleQueryChange(event.currentTarget.value)}
                w={260}
              />
              <Select
                label="Usage"
                value={usageFilter}
                onChange={handleUsageFilterChange}
                data={[
                  { value: "all", label: "All images" },
                  { value: "in_use", label: "In use" },
                  { value: "unused", label: "Unused" },
                  { value: "dangling", label: "Dangling" },
                ]}
                w={170}
              />
            </Group>
            <Text size="sm" c="dimmed">
              Showing {paginatedImages.length} of {filteredImages.length} images
            </Text>
          </Group>
        </Paper>

        <Card withBorder shadow="sm" radius="md">
        <Table stickyHeader highlightOnHover withTableBorder horizontalSpacing="md" verticalSpacing="sm">
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
            <Table.Tbody>
              {rows.length > 0 ? (
                rows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed" py="md">
                      No images match your filters.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
        </Table>
        </Card>
        
        {filteredImages.length > 10 && (
            <Group justify="space-between">
            <Group gap="xs">
              <Text size="sm">Items per page:</Text>
              <Select value={itemsPerPage} onChange={(value) => { if (value) { setItemsPerPage(value); setActivePage(1); } }} data={["10", "25", "50", "100"]} w={80} />
            </Group>
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
