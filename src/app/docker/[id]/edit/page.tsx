'use client';

import { Container, Title, Text, Stack, Group, Button, LoadingOverlay, Box, Alert } from '@mantine/core';
import { ContainerForm } from '@/components/Docker/ContainerForm';
import { useContainerForm } from '@/hooks/useContainerForm';
import { handleUpdateContainer } from '@/lib/container-update';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getContainerConfiguration } from '@/actions/docker';
import { ContainerFormState } from '@/hooks/useContainerForm';
import { IconAlertCircle } from '@tabler/icons-react';

export default function EditContainerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<ContainerFormState>>({});
  const [containerId, setContainerId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
        try {
            const { id } = await params;
            setContainerId(id);
            const response = await getContainerConfiguration(id);
            
            if (response.data) {
                const config = response.data;
                // Transform data if necessary to match form state
                // command is string[] in form state, check API response
                // If API returns string, split it? 
                // The generated type says string[] | null for command
                
                const formData: Partial<ContainerFormState> = {
                    ...config,
                    command: config.command ? config.command : [],
                };
                setInitialData(formData);
            } else {
                throw new Error(response.message || 'Failed to load configuration');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch container configuration');
        } finally {
            setInitialLoading(false);
        }
    };
    fetchData();
  }, [params]);

  // We need to re-initialize the form when initialData changes
  // But useContainerForm initializes only once. 
  // We can key the form component or handle updates.
  // For simplicity, let's render form only after data is loaded.

  return (
    <Container size="xl" py="xl">
        <Box pos="relative">
             <LoadingOverlay visible={loading || initialLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <Stack gap="lg">
                <div>
                    <Title order={2}>Edit Container</Title>
                    <Text c="dimmed">Modify existing container configuration.</Text>
                </div>

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                        {error}
                    </Alert>
                )}

                {!initialLoading && !error && (
                    <EditContainerFormWrapper 
                        initialValues={initialData} 
                        containerId={containerId} 
                        router={router} 
                        setLoading={setLoading}
                    />
                )}
            </Stack>
        </Box>
    </Container>
  );
}

function EditContainerFormWrapper({ 
    initialValues, 
    containerId, 
    router, 
    setLoading 
}: { 
    initialValues: Partial<ContainerFormState>, 
    containerId: string, 
    router: AppRouterInstance, 
    setLoading: (l: boolean) => void 
}) {
    const form = useContainerForm(initialValues);

    return (
        <>
            <ContainerForm form={form} />
            <Group justify="flex-end" mt="xl">
                <Button variant="default" onClick={() => router.back()}>Cancel</Button>
                <Button onClick={() => handleUpdateContainer(containerId, form.formData, form.labelsList, router, setLoading)}>
                    Update Container
                </Button>
            </Group>
        </>
    )
}
