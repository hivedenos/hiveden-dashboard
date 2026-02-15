"use client";

import { ContainerFormState } from "@/hooks/useContainerForm";
import { EnvVar, Mount, Port } from "@/lib/client";
import { Alert, Badge, Box, Button, Grid, Group, List, Paper, Stack, Text, Textarea, ThemeIcon, Title } from "@mantine/core";
import { IconAlertCircle, IconBolt, IconCheck, IconInfoCircle, IconRocket } from "@tabler/icons-react";
import yaml from "js-yaml";
import { useState } from "react";

interface DockerComposeConfig {
  services: {
    [serviceName: string]: {
      container_name?: string;
      image?: string;
      command?: string | string[];
      environment?: { [key: string]: string | number } | string[];
      ports?: (string | number | object)[];
      volumes?: (string | object)[];
      labels?: { [key: string]: string } | string[];
      depends_on?: string[] | { [serviceName: string]: unknown };
    };
  };
}

interface ComposeYamlInputProps {
  onParsed: (data: Partial<ContainerFormState>[]) => void;
  onCancel: () => void;
}

export function ComposeYamlInput({ onParsed, onCancel }: ComposeYamlInputProps) {
  const [yamlContent, setYamlContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    setError(null);
    try {
      const doc = yaml.load(yamlContent) as DockerComposeConfig | undefined;
      if (!doc || !doc.services) {
        throw new Error('Invalid Docker Compose file: No "services" defined.');
      }

      const services = Object.keys(doc.services);
      if (services.length === 0) {
        throw new Error("No services found in the Compose file.");
      }

      const parsedContainers: Partial<ContainerFormState>[] = [];

      services.forEach((serviceName) => {
        const service = doc.services[serviceName];

        const mappedData: Partial<ContainerFormState> = {
          name: service.container_name || serviceName,
          image: service.image || "",
          enabled: true,
        };

        // Command
        if (service.command) {
          if (Array.isArray(service.command)) {
            mappedData.command = service.command;
          } else if (typeof service.command === "string") {
            mappedData.command = service.command.split(" ");
          }
        }

        // Environment
        if (service.environment) {
          const envs: EnvVar[] = [];
          if (Array.isArray(service.environment)) {
            service.environment.forEach((e: string) => {
              const sepIndex = e.indexOf("=");
              if (sepIndex !== -1) {
                envs.push({ name: e.substring(0, sepIndex), value: e.substring(sepIndex + 1) });
              } else {
                // Handle empty value or pass-through
                envs.push({ name: e, value: "" });
              }
            });
          } else if (typeof service.environment === "object") {
            Object.entries(service.environment).forEach(([key, value]) => {
              envs.push({ name: key, value: String(value) });
            });
          }
          mappedData.env = envs;
        }

        // Ports
        if (service.ports) {
          const ports: Port[] = [];
          service.ports.forEach((p: string | number | object) => {
            if (typeof p === "string" || typeof p === "number") {
              const pStr = String(p);
              if (pStr.includes(":")) {
                const parts = pStr.split(":");
                // simple case: 8080:80
                if (parts.length >= 2) {
                  // Check for protocol in the last part (e.g. 80/tcp)
                  const lastPart = parts[parts.length - 1];
                  const containerPart = lastPart.split("/")[0];
                  const protocol = lastPart.includes("/udp") ? "udp" : "tcp";

                  const host = parseInt(parts[parts.length - 2]);
                  const container = parseInt(containerPart);

                  if (!isNaN(host) && !isNaN(container)) {
                    ports.push({ host_port: host, container_port: container, protocol });
                  }
                }
              } else {
                const port = parseInt(pStr);
                // If only one port, docker maps it to an ephemeral port, but we need explicit mapping in UI usually.
                // We'll set both to same for convenience.
                if (!isNaN(port)) {
                  ports.push({ host_port: port, container_port: port, protocol: "tcp" });
                }
              }
            }
          });
          mappedData.ports = ports;
        }

        // Volumes
        if (service.volumes) {
          const mounts: Mount[] = [];
          service.volumes.forEach((v: string | object) => {
            if (typeof v === "string") {
              const parts = v.split(":");
              if (parts.length >= 2) {
                mounts.push({ source: parts[0], target: parts[1], type: "bind" });
              }
            }
          });
          mappedData.mounts = mounts;
        }

        // Labels
        if (service.labels) {
          if (Array.isArray(service.labels)) {
            const labels: Record<string, string> = {};
            service.labels.forEach((l: string) => {
              const [k, v] = l.split("=");
              labels[k] = v || "";
            });
            mappedData.labels = labels;
          } else if (typeof service.labels === "object") {
            mappedData.labels = service.labels as Record<string, string>;
          }
        }

        // Dependencies
        if (service.depends_on) {
          if (Array.isArray(service.depends_on)) {
            mappedData.dependencies = [...new Set(service.depends_on.map((name) => String(name).trim()).filter(Boolean))];
          } else if (typeof service.depends_on === "object") {
            mappedData.dependencies = [...new Set(Object.keys(service.depends_on).map((name) => name.trim()).filter(Boolean))];
          }
        }

        parsedContainers.push(mappedData);
      });

      onParsed(parsedContainers);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
        return;
      }
      setError("Failed to parse YAML");
    }
  };

  return (
    <Box h="100%">
      <Stack gap="sm" mb="lg">
        <Group justify="space-between" align="center">
          <Title order={3}>Import from Docker Compose</Title>
          <Badge variant="light" color="blue">
            Step 1 of 3
          </Badge>
        </Group>
        <Text size="sm" c="dimmed">
          Paste your Compose YAML and we will prefill container settings including environment variables, ports, volumes, and labels.
        </Text>
      </Stack>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Could not parse Compose file" color="red" mb="md" radius="md">
          {error}
        </Alert>
      )}

      <Paper p="lg" withBorder radius="lg">
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Paper withBorder radius="md" p="md">
                <Group gap="xs" mb="xs">
                  <ThemeIcon size="sm" variant="light" color="blue">
                    <IconInfoCircle size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">
                    Import guidance
                  </Text>
                </Group>
                <List size="sm" spacing={8}>
                  <List.Item icon={<IconCheck size={14} />}>Compose file must include a top-level `services` section</List.Item>
                  <List.Item icon={<IconCheck size={14} />}>Each service should define at least `image` and optional `ports`, `environment`, `volumes`</List.Item>
                  <List.Item icon={<IconCheck size={14} />}>After parsing, review each container before deployment</List.Item>
                </List>
              </Paper>

              <Paper withBorder radius="md" p="md">
                <Group gap="xs" mb="xs">
                  <ThemeIcon size="sm" variant="light" color="teal">
                    <IconBolt size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">
                    Parsed automatically
                  </Text>
                </Group>
                <Group gap={6}>
                  <Badge variant="light" color="gray">
                    services
                  </Badge>
                  <Badge variant="light" color="gray">
                    env
                  </Badge>
                  <Badge variant="light" color="gray">
                    ports
                  </Badge>
                  <Badge variant="light" color="gray">
                    volumes
                  </Badge>
                  <Badge variant="light" color="gray">
                    labels
                  </Badge>
                </Group>
              </Paper>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack justify="space-between" h="100%">
              <Textarea
                label="Docker Compose YAML"
                description="Paste your docker-compose.yml content."
                placeholder={`services:\n  web:\n    image: nginx:latest\n    ports:\n      - "8080:80"\n  db:\n    image: postgres:15`}
                minRows={20}
                maxRows={24}
                value={yamlContent}
                autosize
                onChange={(event) => setYamlContent(event.currentTarget.value)}
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
              />

              <Group justify="space-between" mt="md">
                <Text size="xs" c="dimmed">
                  Nothing is deployed in this step. Parsing only validates and maps your input.
                </Text>
                <Group>
                  <Button variant="default" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button leftSection={<IconRocket size={16} />} onClick={handleParse} disabled={!yamlContent.trim()}>
                    Validate & Continue
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>
    </Box>
  );
}
