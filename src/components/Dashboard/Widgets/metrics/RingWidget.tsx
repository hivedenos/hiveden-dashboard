'use client';

import React from 'react';
import { RingProgress, Text } from '@mantine/core';
import { BaseMetricProps, useMetricData, formatValue } from './useMetricData';
import { MetricWrapper } from './MetricWrapper';

export function RingWidget(props: BaseMetricProps) {
    const { data, loading, error } = useMetricData(props, false);
    const value = data?.currentValue || 0;
    const color = props.color || 'blue';

    return (
        <MetricWrapper props={props} loading={loading} error={error}>
            <RingProgress
                size={120}
                thickness={12}
                roundCaps
                sections={[{ value: (props.unit === '%' ? Math.min(value, 100) : 100), color: color }]}
                label={
                    <Text ta="center" fw={700} size="xl">
                        {formatValue(value, props.unit)}
                    </Text>
                }
            />
        </MetricWrapper>
    );
}
