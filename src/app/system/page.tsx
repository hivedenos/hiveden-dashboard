'use client';

import { Container, Tabs, Title, rem } from '@mantine/core';
import { IconWorld, IconFolder, IconServer, IconDatabase } from '@tabler/icons-react';
import { DomainSettings } from '@/components/System/DomainSettings';
import { LocationSettings } from '@/components/System/LocationSettings';
import { DNSSettings } from '@/components/System/DNSSettings';
import { DatabaseList } from '@/components/System/DatabaseList';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SystemPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<string | null>(tabParam || 'domain');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    if (value) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.push(`?${params.toString()}`);
    }
  };

  const iconStyle = { width: rem(12), height: rem(12) };

  return (
    <Container fluid>
      <Title order={2} mb="lg">System Configuration</Title>

      <Tabs value={activeTab} onChange={handleTabChange} variant="outline" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="domain" leftSection={<IconWorld style={iconStyle} />}>
            Domain
          </Tabs.Tab>
          <Tabs.Tab value="dns" leftSection={<IconServer style={iconStyle} />}>
            DNS
          </Tabs.Tab>
          <Tabs.Tab value="database" leftSection={<IconDatabase style={iconStyle} />}>
            Database
          </Tabs.Tab>
          <Tabs.Tab value="locations" leftSection={<IconFolder style={iconStyle} />}>
            Storage Locations
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="domain">
          <DomainSettings />
        </Tabs.Panel>

        <Tabs.Panel value="dns">
          <DNSSettings />
        </Tabs.Panel>

        <Tabs.Panel value="database">
          <DatabaseList />
        </Tabs.Panel>

        <Tabs.Panel value="locations">
          <LocationSettings />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}

export default function SystemPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SystemPageContent />
    </Suspense>
  );
}
