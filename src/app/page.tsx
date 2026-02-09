import { Container, Title } from '@mantine/core';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <Container fluid>
      <Title order={2} mb="lg">System Overview</Title>
      <DashboardLayout />
    </Container>
  );
}
