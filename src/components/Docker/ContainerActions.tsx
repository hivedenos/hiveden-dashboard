"use client";

import { Button, Group, Tooltip, ActionIcon } from "@mantine/core";
import { IconPlayerPlay, IconPlayerStop, IconRefresh, IconTrash, IconEdit, IconEye } from "@tabler/icons-react";
import { useState } from "react";
import { stopContainer, startContainer, removeContainer, restartContainer } from "@/actions/docker";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import Link from "next/link";

interface ContainerActionsProps {
  containerId: string;
  containerState: string;
  size: "big" | "small";
}

export function ContainerActions({ containerId, containerState, size }: ContainerActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this container?")) return;
    setLoading("delete");
    try {
      await removeContainer(containerId);
      notifications.show({
        title: "Container deleted",
        message: "The container has been deleted successfully",
        color: "green",
      });
      router.push("/docker");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to delete container",
        color: "red",
      });
    } finally {
      setLoading(null);
    }
  };

  const isRunning = containerState === "running";
  const isRestarting = containerState === "restarting";
  const canStart = containerState === "exited" || containerState === "created";
  const canStop = isRunning || isRestarting;
  const canRestart = isRunning || isRestarting;
  const canDelete = containerState === "exited" || containerState === "created" || containerState === "dead";

  if (size === "small") {
    return (
      <Group gap="xs">
        <ActionIcon component={Link} href={`/docker/${containerId}`} variant="light" color="blue" title="View Details">
          <IconEye size={16} />
        </ActionIcon>
        
        <ActionIcon component={Link} href={`/docker/${containerId}/edit`} variant="light" color="cyan" title="Edit">
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

        <ActionIcon 
          variant="light" 
          color="blue" 
          onClick={handleRestart} 
          loading={loading === "restart"}
          disabled={!canRestart}
          title="Restart"
        >
          <IconRefresh size={16} />
        </ActionIcon>

        <Tooltip label="Container must be stopped to delete" disabled={canDelete} withArrow>
          <div>
            <ActionIcon
              variant="light"
              color="red"
              onClick={handleDelete}
              loading={loading === "delete"}
              disabled={!canDelete}
              title="Delete"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </div>
        </Tooltip>
      </Group>
    );
  }

  return (
    <Group gap="xs">
      <Button 
        component={Link} 
        href={`/docker/${containerId}/edit`} 
        variant="light" 
        color="cyan" 
        leftSection={<IconEdit size={16} />}
      >
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

      <Button 
        variant="light" 
        color="blue" 
        leftSection={<IconRefresh size={16} />} 
        onClick={handleRestart} 
        loading={loading === "restart"}
        disabled={!canRestart}
      >
        Restart
      </Button>

      <Tooltip label="Container must be stopped to delete" disabled={canDelete} withArrow>
        <Button
          variant="light"
          color="red"
          leftSection={<IconTrash size={16} />}
          onClick={handleDelete}
          loading={loading === "delete"}
          disabled={!canDelete}
        >
          Delete
        </Button>
      </Tooltip>
    </Group>
  );
}
