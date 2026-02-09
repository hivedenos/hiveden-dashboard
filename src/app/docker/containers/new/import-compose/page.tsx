"use client";

import { ComposeYamlInput } from "@/components/Docker/ComposeImport";
import { CreateDockerContainers } from "@/components/Docker/CreateDockerContainers";
import { MultiContainerReview } from "@/components/Docker/MultiContainerReview";
import { ContainerFormState } from "@/hooks/useContainerForm";
import { Box, Container, Group, Paper, Stepper, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCheck, IconFileCode2, IconRocket, IconShieldCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ImportComposePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [parsedData, setParsedData] = useState<Partial<ContainerFormState>[]>([]);
  const [containersToCreate, setContainersToCreate] = useState<ContainerFormState[]>([]);
  const router = useRouter();

  const handleParsed = (data: Partial<ContainerFormState>[]) => {
    setParsedData(data);
    setActiveStep(1);
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const handleSubmit = (data: ContainerFormState[]) => {
    setContainersToCreate(data);
    setActiveStep(2);
  };

  return (
    <Container fluid p={0}>
      <Paper p="lg" radius="lg" withBorder mb="md">
        <Group justify="space-between" align="flex-start" gap="md">
          <Box>
            <Group gap="xs" mb={6}>
              <ThemeIcon variant="light" color="blue" radius="xl">
                <IconFileCode2 size={16} />
              </ThemeIcon>
              <Text size="sm" c="dimmed" fw={600}>
                Docker Compose Import Wizard
              </Text>
            </Group>
            <Title order={3}>Create containers from a Compose file</Title>
            <Text size="sm" c="dimmed" mt={6}>
              Paste YAML, validate service mappings, then deploy all parsed containers in one flow.
            </Text>
          </Box>
        </Group>
      </Paper>

      <Paper p="lg" radius="lg" withBorder>
        <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false} size="sm">
          <Stepper.Step label="Compose YAML" description="Parse services" icon={<IconFileCode2 size={16} />}>
            <Box py="md">
              <ComposeYamlInput onParsed={handleParsed} onCancel={() => router.push("/docker/containers")} />
            </Box>
          </Stepper.Step>
          <Stepper.Step label="Validation" description="Review configuration" icon={<IconShieldCheck size={16} />}>
            <Box py="md">{parsedData.length > 0 && <MultiContainerReview initialContainers={parsedData} onBack={handleBack} onSubmit={handleSubmit} />}</Box>
          </Stepper.Step>
          <Stepper.Step label="Deployment" description="Create containers" icon={<IconRocket size={16} />}>
            <Box py="xl">{activeStep === 2 && containersToCreate.length > 0 && <CreateDockerContainers containers={containersToCreate} />}</Box>
          </Stepper.Step>
          <Stepper.Completed>
            <Group gap="xs" align="center">
              <ThemeIcon color="teal" variant="light" radius="xl">
                <IconCheck size={16} />
              </ThemeIcon>
              <Text size="sm">All steps are complete.</Text>
            </Group>
          </Stepper.Completed>
        </Stepper>
      </Paper>
    </Container>
  );
}
