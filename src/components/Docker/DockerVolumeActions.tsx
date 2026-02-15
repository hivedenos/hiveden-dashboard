"use client";

import { deleteDockerVolume } from "@/actions/docker";
import { Button, Group, Modal, Text, Tooltip, ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";

interface DockerVolumeActionsProps {
  volumeName: string;
}

export function DockerVolumeActions({ volumeName }: DockerVolumeActionsProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteDockerVolume(volumeName);
      notifications.show({
        title: "Success",
        message: `Volume ${volumeName} deleted successfully`,
        color: "green",
      });
      close();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete volume";
      notifications.show({
        title: "Error",
        message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip label="Delete Volume">
        <ActionIcon variant="light" color="red" onClick={open} aria-label={`Delete volume ${volumeName}`}>
          <IconTrash size={16} />
        </ActionIcon>
      </Tooltip>

      <Modal opened={opened} onClose={close} title="Delete Volume" centered>
        <Text size="sm" mb="lg">
          Are you sure you want to delete volume <Text span fw={700}>{volumeName}</Text>? This action cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} loading={loading}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}
