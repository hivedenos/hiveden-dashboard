"use client";

import { ComposeYamlInput } from "@/components/Docker/ComposeImport";
import { CreateDockerContainers } from "@/components/Docker/CreateDockerContainers";
import { MultiContainerReview } from "@/components/Docker/MultiContainerReview";
import { ContainerFormState } from "@/hooks/useContainerForm";
import { Box, Container, Stepper } from "@mantine/core";
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
    <Container fluid>
      <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false}>
        <Stepper.Step label="YAML" description="Paste Docker Compose">
          <Box py="md">
            <ComposeYamlInput onParsed={handleParsed} onCancel={() => router.push("/docker/containers")} />
          </Box>
        </Stepper.Step>
        <Stepper.Step label="Validation" description="Review Configuration">
          <Box py="md">{parsedData.length > 0 && <MultiContainerReview initialContainers={parsedData} onBack={handleBack} onSubmit={handleSubmit} />}</Box>
        </Stepper.Step>
        <Stepper.Step label="Submit" description="Deploying Containers">
          <Box py="xl">{activeStep === 2 && containersToCreate.length > 0 && <CreateDockerContainers containers={containersToCreate} />}</Box>
        </Stepper.Step>
      </Stepper>
    </Container>
  );
}
