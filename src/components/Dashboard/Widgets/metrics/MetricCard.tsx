import { Card, Text, Skeleton, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
}

export function MetricCard({ title, children, loading, error }: MetricCardProps) {
  if (error) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
        <Text fw={700} mb="xs">{title}</Text>
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
      <Text fw={700} mb="xs">{title}</Text>
      {loading ? (
        <Skeleton height={100} radius="md" />
      ) : (
        children
      )}
    </Card>
  );
}
