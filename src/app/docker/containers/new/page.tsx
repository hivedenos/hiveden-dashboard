"use client";

import { ContainerForm } from "@/components/Docker/ContainerForm";
import { useContainerForm } from "@/hooks/useContainerForm";
import { handleCreateContainer } from "@/lib/container-submission";
import { Box, Button, Container, Group, LoadingOverlay, Stack, Text, Title } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewContainerPage() {
  const form = useContainerForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Container size="xl" py="xl">
      <Box pos="relative">
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <Stack gap="lg">
          <div>
            <Title order={2}>New Container</Title>
            <Text c="dimmed">Deploy a new Docker container or create a template.</Text>
          </div>
          <ContainerForm form={form} />
          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => handleCreateContainer(form.formData, form.labelsList, router, setLoading)} loading={loading}>
              Deploy Container
            </Button>
          </Group>
        </Stack>
      </Box>
    </Container>
  );
}
