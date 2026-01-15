"use client";

import { SimpleGrid } from "@mantine/core";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { CPUMetric } from "./CPUMetric";
import { MemoryMetric } from "./MemoryMetric";
import { DiskMetric } from "./DiskMetric";

export function SystemMetricsGrid() {
  const { data, loading, error } = useSystemMetrics();

  return (
    <SimpleGrid cols={{ base: 1, xs: 1, sm: 2, md: 3 }} spacing="md">
       <CPUMetric 
          data={data?.cpu} 
          loading={loading} 
          error={error} 
       />
       <MemoryMetric 
          data={data?.memory} 
          loading={loading} 
          error={error} 
       />
       <DiskMetric 
          data={data?.disk} 
          loading={loading} 
          error={error} 
       />
    </SimpleGrid>
  );
}
