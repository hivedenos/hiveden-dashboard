"use client";

import { removeContainer, restartContainer, startContainer, stopContainer } from "@/actions/docker";
import { ActionIcon, Button, Checkbox, Group, Modal, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconEye, IconPlayerPlay, IconPlayerStop, IconRefresh, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ContainerActionsProps {
  containerId: string;
  containerState: string;
  size: "big" | "small";
}

export function ContainerActions({ containerId, containerState, size }: ContainerActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteVolumes, setDeleteVolumes] = useState(true);
  const [deleteDatabase, setDeleteDatabase] = useState(true);
  const [deleteDns, setDeleteDns] = useState(true);

  const router = useRouter();

  const handleStart = async () => {
    setLoading("start");
    try {
      await startContainer(containerId);
      notifications.show({
        title: "Container started",
        message: "The container has been started successfully",
        color: "green",
      });
      router.refresh();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to start container",
        color: "red",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleStop = async () => {
    setLoading("stop");
    try {
      await stopContainer(containerId);
      notifications.show({
        title: "Container stopped",
        message: "The container has been stopped successfully",
        color: "green",
      });
      router.refresh();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to stop container",
        color: "red",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleRestart = async () => {
    setLoading("restart");
    try {
      await restartContainer(containerId);
      notifications.show({
        title: "Container restarted",
        message: "The container has been restarted successfully",
        color: "green",
      });
      router.refresh();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to restart container",
        color: "red",
      });
    } finally {
      setLoading(null);
    }
  };

  const confirmDelete = async () => {
    setLoading("delete");
    try {
      await removeContainer(containerId, deleteDatabase, deleteVolumes, deleteDns);
      notifications.show({
        title: "Container deleted",
        message: "The container has been deleted successfully",
        color: "green",
      });
      router.push("/docker/containers");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to delete container",
        color: "red",
      });
    } finally {
      setLoading(null);
      close();
    }
  };

  const isRunning = containerState === "running";
  const isRestarting = containerState === "restarting";
  const canStart = containerState === "exited" || containerState === "created";
  const canStop = isRunning || isRestarting;
  const canRestart = isRunning || isRestarting;
  const canDelete = containerState === "exited" || containerState === "created" || containerState === "dead";

  const deleteModal = (
    <Modal opened={opened} onClose={close} title="Delete Container">
      <Stack>
        <Text size="sm">Are you sure you want to delete this container?</Text>
        <Checkbox label="Delete Container" checked readOnly description="This action cannot be undone." />
        <Checkbox label="Delete App Directory" checked={deleteVolumes} onChange={(e) => setDeleteVolumes(e.currentTarget.checked)} description="Removes persistent data in app directory." />
        <Checkbox label="Delete Database" checked={deleteDatabase} onChange={(e) => setDeleteDatabase(e.currentTarget.checked)} description="Removes associated database." />
        <Checkbox label="Delete DNS Entry" checked={deleteDns} onChange={(e) => setDeleteDns(e.currentTarget.checked)} description="Removes associated DNS record." />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={close}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete} loading={loading === "delete"}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );

  if (size === "small") {
    return (
      <>
        {deleteModal}
        <Group gap="xs">
          <ActionIcon component={Link} href={`/docker/containers/${containerId}`} variant="light" color="blue" title="View Details">
            <IconEye size={16} />
          </ActionIcon>

          <ActionIcon component={Link} href={`/docker/containers/${containerId}/edit`} variant="light" color="cyan" title="Edit">
            <IconEdit size={16} />
          </ActionIcon>

          {canStop ? (
            <ActionIcon variant="light" color="orange" onClick={handleStop} loading={loading === "stop"} title="Stop">
              <IconPlayerStop size={16} />
            </ActionIcon>
          ) : (
            <ActionIcon variant="light" color="green" onClick={handleStart} loading={loading === "start"} disabled={!canStart} title="Start">
              <IconPlayerPlay size={16} />
            </ActionIcon>
          )}

          <ActionIcon variant="light" color="blue" onClick={handleRestart} loading={loading === "restart"} disabled={!canRestart} title="Restart">
            <IconRefresh size={16} />
          </ActionIcon>

          <Tooltip label="Container must be stopped to delete" disabled={canDelete} withArrow>
            <div>
              <ActionIcon variant="light" color="red" onClick={open} loading={loading === "delete"} disabled={!canDelete} title="Delete">
                <IconTrash size={16} />
              </ActionIcon>
            </div>
          </Tooltip>
        </Group>
      </>
    );
  }

  return (
    <>
      {deleteModal}
      <Group gap="xs">
        <Button component={Link} href={`/docker/containers/${containerId}/edit`} variant="light" color="cyan" leftSection={<IconEdit size={16} />}>
          Edit
        </Button>

        {canStop ? (
          <Button variant="light" color="orange" leftSection={<IconPlayerStop size={16} />} onClick={handleStop} loading={loading === "stop"}>
            Stop
          </Button>
        ) : (
          <Button variant="light" color="green" leftSection={<IconPlayerPlay size={16} />} onClick={handleStart} loading={loading === "start"} disabled={!canStart}>
            Start
          </Button>
        )}

        <Button variant="light" color="blue" leftSection={<IconRefresh size={16} />} onClick={handleRestart} loading={loading === "restart"} disabled={!canRestart}>
          Restart
        </Button>

        <Tooltip label="Container must be stopped to delete" disabled={canDelete} withArrow>
          <Button variant="light" color="red" leftSection={<IconTrash size={16} />} onClick={open} loading={loading === "delete"} disabled={!canDelete}>
            Delete
          </Button>
        </Tooltip>
      </Group>
    </>
  );
}
