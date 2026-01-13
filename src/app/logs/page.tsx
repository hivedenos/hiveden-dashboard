import { Container, Title } from '@mantine/core';
import LogsTable from '@/components/Logs/LogsTable';

export default function LogsPage() {
  return (
    <Container fluid>
      <Title order={2} mb="lg">Logs</Title>
      <LogsTable />
    </Container>
  );
}
