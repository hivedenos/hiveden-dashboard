import { Badge, Container, Group, Paper, Text, ThemeIcon, Title } from '@mantine/core';
import LogsTable from '@/components/Logs/LogsTable';
import { IconFileText } from '@tabler/icons-react';

export default function LogsPage() {
  return (
    <Container fluid>
      <Paper withBorder radius="lg" p="lg" mb="md">
        <Group justify="space-between" align="flex-start" gap="md">
          <div>
            <Group gap="xs" mb={6}>
              <ThemeIcon variant="light" color="blue" radius="xl">
                <IconFileText size={16} />
              </ThemeIcon>
              <Text size="sm" c="dimmed" fw={600}>
                System Event Stream
              </Text>
            </Group>
            <Title order={2}>Logs</Title>
            <Text c="dimmed" mt={6}>
              Explore platform logs with fast filtering, severity signals, and detailed event context.
            </Text>
          </div>
          <Badge size="lg" color="blue" variant="light">
            Live Query
          </Badge>
        </Group>
      </Paper>
      <LogsTable />
    </Container>
  );
}
