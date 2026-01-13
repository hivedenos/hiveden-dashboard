"use client";

import { createContainer } from "@/actions/docker";
import { ContainerFormState } from "@/hooks/useContainerForm";
import { ContainerCreate } from "@/lib/client";
import { Alert, Box, Button, Group, Loader, Progress, ScrollArea, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCheck, IconInfoCircle, IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface CreateDockerContainersProps {
  containers: ContainerFormState[];
  onComplete?: () => void;
}

interface ContainerStatus {
  name: string;
  status: "pending" | "creating" | "success" | "error";
  message?: string;
}

export function CreateDockerContainers({ containers, onComplete }: CreateDockerContainersProps) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<ContainerStatus[]>(containers.map((c) => ({ name: c.name, status: "pending" })));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const isRunning = useRef(false);

  useEffect(() => {
    if (isRunning.current) return;
    isRunning.current = true;
    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processQueue = async () => {
    for (let i = 0; i < containers.length; i++) {
      setCurrentIdx(i);
      const containerData = containers[i];

      // Update status to creating
      updateStatus(i, "creating");

      try {
        // Prepare payload
        const labelsRecord: Record<string, string> = {};
        if (containerData.labels) {
          Object.entries(containerData.labels).forEach(([k, v]) => {
            labelsRecord[k] = String(v);
          });
        } else if (Array.isArray(containerData.labels)) {
          // Handle if it came as array (though form state usually has it as object or we convert it)
          // Based on hook, labelsList is separate, but formData.labels is Record<string,string> usually
        }

        // If the input is from ContainerFormState, we might need to be careful about labels.
        // In useContainerForm, labels are kept in labelsList and formData.labels might be stale or not updated on every change if not handled.
        // However, the previous `handleCreateContainer` in `container-submission.ts` took `labelsList` separately.
        // `ContainerFormState` has `labels: Record<string, string>`.
        // We should ensure the `containers` prop passed here has the correct labels.
        // If this component receives the `formData` from `useContainerForm`, `formData.labels` might not be the updated one if the hook logic separates them.
        // Let's assume the caller ensures `containers` has the correct `labels` object populated from `labelsList`.

        const commonData = {
          ...containerData,
          // Ensure command is null if empty array
          command: containerData.command && containerData.command.length > 0 ? containerData.command : null,
        };

        const payload: ContainerCreate = {
          ...commonData,
          is_container: true,
        };

        console.log("Create container payload: ", payload);

        await createContainer(payload);
        updateStatus(i, "success");
      } catch (error: any) {
        updateStatus(i, "error", error.message || "Unknown error");
      }
      setCompletedCount((prev) => prev + 1);
    }

    if (onComplete) {
      onComplete();
    } else {
      // Default behavior if no onComplete
      setTimeout(() => {
        router.push("/docker/containers");
        router.refresh();
      }, 3500);
    }
  };

  const updateStatus = (index: number, status: ContainerStatus["status"], message?: string) => {
    setStatuses((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status, message };
      return next;
    });
  };

  const currentContainer = containers[currentIdx];
  const progress = (completedCount / containers.length) * 100;
  const isFinished = completedCount === containers.length;

  return (
    <Stack gap="lg" align="stretch">
      {!isFinished && (
        <Stack align="center" gap="xs">
          <Loader size="lg" />
          <Text size="lg" fw={500}>
            Creating container {currentContainer?.name}...
          </Text>
        </Stack>
      )}

      {isFinished && (
        <Stack align="center" gap="xs">
          <ThemeIcon size={50} radius="xl" color="green">
            <IconCheck size={30} />
          </ThemeIcon>
          <Text size="lg" fw={500}>
            Process Complete
          </Text>
          <Button
            onClick={() => {
              router.push("/docker/containers");
              router.refresh();
            }}
          >
            Go to Containers
          </Button>
        </Stack>
      )}

      <Box>
        <Group justify="space-between" mb={5}>
          <Text size="sm">Progress</Text>
          <Text size="sm">
            {completedCount} / {containers.length}
          </Text>
        </Group>
        <Progress value={progress} size="xl" radius="xl" animated={!isFinished} />
      </Box>

      <Box>
        <Title order={5} mb="sm">
          Status Log
        </Title>
        <ScrollArea h={300} type="auto" offsetScrollbars>
          <Stack gap="xs">
            {statuses.map((s, idx) => (
              <Alert key={idx} variant="light" color={s.status === "success" ? "green" : s.status === "error" ? "red" : s.status === "creating" ? "blue" : "gray"} title={s.name} icon={s.status === "success" ? <IconCheck size={16} /> : s.status === "error" ? <IconX size={16} /> : s.status === "creating" ? <Loader size={16} /> : <IconInfoCircle size={16} />} styles={{ title: { marginBottom: s.message ? 4 : 0 } }}>
                {s.message}
                {s.status === "pending" && "Waiting..."}
                {s.status === "creating" && "Creating..."}
                {s.status === "success" && "Successfully created."}
              </Alert>
            ))}
          </Stack>
        </ScrollArea>
      </Box>
    </Stack>
  );
}
