'use client';

import React from 'react';
import { Group, Stack, Text, Box } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { BaseMetricProps, useMetricData, formatValue } from './useMetricData';
import { MetricWrapper } from './MetricWrapper';

export function SparklineWidget(props: BaseMetricProps) {
    const { data, loading, error } = useMetricData(props, true);
    const value = data?.currentValue || 0;
    const color = props.color || 'blue';

    return (
        <MetricWrapper props={props} loading={loading} error={error}>
            {data?.history && (
                <Group w="100%" h="100%" align="flex-end" justify="space-between">
                    <Stack gap={0}>
                        <Text size="xl" fw={700}>
                            {formatValue(value, props.unit)}
                        </Text>
                        <Text size="xs" c="dimmed">Last 30 min</Text>
                    </Stack>
                    <Box style={{ width: '60%', height: 60 }}>
                        <AreaChart
                            h={60}
                            data={data.history.map(p => ({
                                time: new Date(p.time).toLocaleTimeString(),
                                value: p.value,
                            }))}
                            dataKey="time"
                            series={[{ name: 'value', color: color }]}
                            curveType="monotone"
                            gridAxis="none"
                            withDots={false}
                            withXAxis={false}
                            withYAxis={false}
                        />
                    </Box>
                </Group>
            )}
        </MetricWrapper>
    );
}
