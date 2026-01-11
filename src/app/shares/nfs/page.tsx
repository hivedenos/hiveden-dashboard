import { Container, Title, Text, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

export default function NfsPage() {
  return (
    <Container fluid>
      <Title order={2} mb="lg">NFS Shares</Title>
      <Alert variant="light" color="blue" title="Coming Soon" icon={<IconInfoCircle />}>
        <Text>NFS Share management will be implemented in a future update.</Text>
      </Alert>
    </Container>
  );
}
