'use client';

import React from 'react';
import { Paper, Text, Group, Stack, Loader, ThemeIcon, Box } from '@mantine/core';
import { IconActivity, IconAlertCircle } from '@tabler/icons-react';
import { BaseMetricProps } from './useMetricData';

interface MetricWrapperProps {
    children: React.ReactNode;
    props: BaseMetricProps;
    loading: boolean;
    error: string | null;
    headerExtra?: React.ReactNode;
}

export const MetricWrapper = ({ 
    children, 
    props, 
    loading, 
    error,
    headerExtra 
}: MetricWrapperProps) => {
  const { title = 'Metric', description } = props;

  if (error) {
      return (
        <Paper p="md" radius="md" withBorder h="100%">
            <Stack align="center" justify="center" h="100%">
                <ThemeIcon color="red" variant="light" size="lg"><IconAlertCircle /></ThemeIcon>
                <Text c="red" size="sm" ta="center" style={{ wordBreak: 'break-all' }}>{error}</Text>
            </Stack>
        </Paper>
      );
  }

  if (loading) {
      return (
        <Paper p="md" radius="md" withBorder h="100%">
            <Stack align="center" justify="center" h="100%">
                <Loader size="sm" />
            </Stack>
        </Paper>
      );
  }

  return (
    <Paper p="md" radius="md" withBorder h="100%" display="flex" style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
      <Group justify="space-between" align="flex-start" mb="xs">
        <Group gap="xs">
            <ThemeIcon variant="light" color="gray" size="md">
                <IconActivity size={20} />
            </ThemeIcon>
            <Stack gap={0}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {title}
                </Text>
                {description && <Text size="xs" c="dimmed" style={{ lineHeight: 1 }}>{description}</Text>}
            </Stack>
        </Group>
        {headerExtra}
      </Group>
      
      <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Box>
    </Paper>
  );
};
