import type { FilesystemLocation } from "@/lib/client";
import { Badge, Box, Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title, rem } from "@mantine/core";
import { IconApps, IconBook, IconDatabase, IconDownload, IconFiles, IconFolder, IconMovie, IconMusic, IconPhoto } from "@tabler/icons-react";

interface StorageLocationsProps {
  locations: FilesystemLocation[];
}

export function StorageLocations({ locations }: StorageLocationsProps) {
  const getIcon = (key: string | null | undefined) => {
    switch (key) {
      case "movies":
      case "tvshows":
        return IconMovie;
      case "apps":
        return IconApps;
      case "music":
        return IconMusic;
      case "downloads":
        return IconDownload;
      case "pictures":
        return IconPhoto;
      case "ebooks":
        return IconBook;
      case "isos":
      case "backups":
        return IconDatabase;
      case "documents":
        return IconFiles;
      default:
        return IconFolder;
    }
  };

  const getColor = (key: string | null | undefined) => {
    switch (key) {
      case "movies":
      case "tvshows":
        return "violet";
      case "apps":
        return "blue";
      case "music":
        return "cyan";
      case "downloads":
        return "green";
      case "pictures":
        return "pink";
      case "ebooks":
        return "orange";
      case "isos":
      case "backups":
        return "yellow";
      default:
        return "gray";
    }
  };

  return (
    <Box 
      style={{
        padding: '2rem',
        backgroundColor: 'var(--mantine-color-dark-8)',
        borderRadius: 'var(--mantine-radius-md)',
        height: '100%',
        width: '100%'
      }}
    >
      <Title order={3} mb="md">
        Storage Locations
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, xl: 2 }} spacing="md">
        {locations.map((location) => {
          const Icon = getIcon(location.key);
          const color = getColor(location.key);

          return (
            <Card key={location.key || location.path} padding="md" radius="md" withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Group wrap="nowrap">
                  <ThemeIcon size="xl" radius="md" variant="light" color={color}>
                    <Icon style={{ width: rem(24), height: rem(24) }} />
                  </ThemeIcon>

                  <Stack gap={0} style={{ overflow: "hidden" }}>
                    <Text fw={600} size="lg" truncate>
                      {location.label}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {location.path}
                    </Text>
                  </Stack>
                </Group>

                <Badge color={location.exists ? "green" : "yellow"} variant="light">
                  {location.exists ? "Active" : "Pending"}
                </Badge>
              </Group>
            </Card>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}
