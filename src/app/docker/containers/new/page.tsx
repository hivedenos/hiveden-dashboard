"use client";

import { ContainerForm, DependencyStatusSnapshot } from "@/components/Docker/ContainerForm";
import { useContainerForm } from "@/hooks/useContainerForm";
import { handleCreateContainer } from "@/lib/container-submission";
import { Alert, Badge, Box, Button, Container, Divider, Grid, Group, LoadingOverlay, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconAlertCircle, IconBolt, IconChecklist, IconCpu, IconRocket, IconShieldCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewContainerPage() {
  const form = useContainerForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dependencyStatus, setDependencyStatus] = useState<DependencyStatusSnapshot>({
    hasDependencies: false,
    isChecking: false,
    allSatisfied: true,
    missing: [],
    hasError: false,
  });

  const isDeployBlocked = dependencyStatus.hasDependencies && (dependencyStatus.isChecking || !dependencyStatus.allSatisfied);

  return (
    <Container size="xl" py="xl">
      <Box pos="relative">
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <Stack gap="lg">
          <Paper withBorder radius="lg" p="lg">
            <Group justify="space-between" align="flex-start" gap="md">
              <Box>
                <Group gap="xs" mb={6}>
                  <ThemeIcon color="blue" variant="light" radius="xl">
                    <IconRocket size={16} />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed" fw={600}>
                    Container Deployment
                  </Text>
                </Group>
                <Title order={2}>Create a New Docker Container</Title>
                <Text c="dimmed" mt={6}>
                  Configure runtime, networking, storage, and metadata in one flow. This form supports both production-ready deployments and reusable templates.
                </Text>
              </Box>
              <Badge variant="light" color="blue" size="lg">
                Manual Creation
              </Badge>
            </Group>

            <Divider my="md" />

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Group gap="xs" wrap="nowrap" align="flex-start">
                  <ThemeIcon variant="light" color="teal" mt={2}>
                    <IconChecklist size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={600} size="sm">
                      Required Basics
                    </Text>
                    <Text size="xs" c="dimmed">
                      Name and image/tag are required before deployment.
                    </Text>
                  </Box>
                </Group>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Group gap="xs" wrap="nowrap" align="flex-start">
                  <ThemeIcon variant="light" color="orange" mt={2}>
                    <IconCpu size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={600} size="sm">
                      Runtime Controls
                    </Text>
                    <Text size="xs" c="dimmed">
                      Configure ports, mounts, env vars, devices, and labels.
                    </Text>
                  </Box>
                </Group>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Group gap="xs" wrap="nowrap" align="flex-start">
                  <ThemeIcon variant="light" color="grape" mt={2}>
                    <IconShieldCheck size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={600} size="sm">
                      Ingress Consistency
                    </Text>
                    <Text size="xs" c="dimmed">
                      The form flags conflicts between ingress toggle and ingress port selection.
                    </Text>
                  </Box>
                </Group>
              </Grid.Col>
            </Grid>
          </Paper>

          <Alert color="blue" variant="light" radius="md" icon={<IconBolt size={16} />} title="Tip">
            Start with General Configuration first, then move top to bottom for faster setup and fewer validation issues.
          </Alert>

          <ContainerForm form={form} onDependenciesStatusChange={setDependencyStatus} />

          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" align="center" gap="sm">
              <Text size="sm" c="dimmed">
                Review ingress warnings and required fields before deploying.
              </Text>
              <Group>
                <Button variant="default" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  leftSection={<IconRocket size={16} />}
                  onClick={() => handleCreateContainer(form.formData, form.labelsList, router, setLoading)}
                  loading={loading}
                  disabled={isDeployBlocked}
                >
                  Deploy Container
                </Button>
              </Group>
            </Group>
          </Paper>
          {isDeployBlocked && (
            <Alert color="red" variant="light" radius="md" icon={<IconAlertCircle size={16} />} title="Dependencies are not satisfied">
              {dependencyStatus.isChecking
                ? "Dependency check is still running. Wait for completion before deploying."
                : dependencyStatus.hasError
                  ? "Dependency check failed. Re-check dependencies before deploying."
                  : `Missing dependencies: ${dependencyStatus.missing.join(", ")}`}
            </Alert>
          )}
          {loading && (
            <Alert color="blue" variant="light" radius="md" icon={<IconAlertCircle size={16} />}>
              Deployment request in progress. Please wait while container creation is submitted.
            </Alert>
          )}
        </Stack>
      </Box>
    </Container>
  );
}
