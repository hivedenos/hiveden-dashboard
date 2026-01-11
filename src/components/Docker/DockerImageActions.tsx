"use client";

import { ActionIcon, Tooltip, Modal, Button, Text, Group } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { deleteImage } from "@/actions/docker";

interface DockerImageActionsProps {
  imageId: string;
  imageTags: string[];
}

export function DockerImageActions({ imageId, imageTags }: DockerImageActionsProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteImage(imageId);
      notifications.show({
        title: "Success",
        message: "Image deleted successfully",
        color: "green",
      });
      close();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to delete image",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayName = imageTags.length > 0 ? imageTags[0] : imageId.substring(0, 12);

  return (
    <>
      <Tooltip label="Delete Image">
        <ActionIcon variant="light" color="red" onClick={open}>
          <IconTrash size={16} />
        </ActionIcon>
      </Tooltip>

      <Modal opened={opened} onClose={close} title="Delete Image" centered>
        <Text size="sm" mb="lg">
          Are you sure you want to delete image <Text span fw={700}>{displayName}</Text>? 
          This action cannot be undone.
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
