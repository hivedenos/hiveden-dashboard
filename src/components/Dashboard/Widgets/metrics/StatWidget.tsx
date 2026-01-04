'use client';

import React from 'react';
import { Text, Badge } from '@mantine/core';
import { BaseMetricProps, useMetricData, formatValue } from './useMetricData';
import { MetricWrapper } from './MetricWrapper';

export function StatWidget(props: BaseMetricProps) {
    const { data, loading, error } = useMetricData(props, false);
    const value = data?.currentValue || 0;
    const color = props.color || 'blue';

    return (
        <MetricWrapper 
            props={props} 
            loading={loading} 
            error={error}
            headerExtra={
                <Badge variant="light" color={color}>Live</Badge>
            }
        >
             <Text size="xl" fw={800} style={{ fontSize: '2.5rem' }}>
                {formatValue(value, props.unit)}
             </Text>
        </MetricWrapper>
    );
}
