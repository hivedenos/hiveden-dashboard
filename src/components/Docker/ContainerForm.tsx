import { TextInput, Button, Group, Box, Stack, ActionIcon, NumberInput, Select, Paper, Title, Checkbox, Text } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { UseContainerFormReturn } from "@/hooks/useContainerForm";

interface ContainerFormProps {
  form: UseContainerFormReturn;
}

export function ContainerForm({ form }: ContainerFormProps) {
  const {
    formData,
    labelsList,
    mountErrors,
    handleChange,
    addCommandArg,
    removeCommandArg,
    updateCommandArg,
    addEnv,
    removeEnv,
    updateEnv,
    addPort,
    removePort,
    updatePort,
    addMount,
    removeMount,
    updateMount,
    addLabel,
    removeLabel,
    updateLabel,
  } = form;

  const isIngressSubdomainEnabled = formData.ingressSubdomainChecked;
  // Initialize config if it doesn't exist but we need it for state
  const ingressConfig = formData.ingress_config || { domain: "", port: 0 };
  const ingressPort = ingressConfig.port;

  // Validation Logic
  const showIngressPortError = isIngressSubdomainEnabled && ingressPort === 0;
  const showIngressSubdomainError = !isIngressSubdomainEnabled && ingressPort > 0;

  return (
    <Box pos="relative">
      <Stack gap="lg">
        <Paper p="md" withBorder radius="md">
          <Group justify="space-between" mb="md">
            <Title order={4}>General Configuration</Title>
          </Group>
          <SimpleGridWrapper>
            <TextInput
              label="Name"
              placeholder="my-container"
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            <TextInput
              label="Image"
              placeholder="nginx:latest"
              required
              value={formData.image}
              onChange={(e) => handleChange("image", e.target.value)}
            />
          </SimpleGridWrapper>

          <Checkbox
            label="Ingress Subdomain"
            checked={isIngressSubdomainEnabled}
            onChange={(e) => {
              handleChange("ingressSubdomainChecked", e.currentTarget.checked);
              // Ensure ingress_config exists if we enable it
              if (e.currentTarget.checked && !formData.ingress_config) {
                handleChange('ingress_config', { domain: formData.name, port: 0 });
              }
            }}
            mt="md"
          />
          {showIngressPortError && (
            <Text color="red" size="sm" mt="xs">
              Ingress Subdomain is enabled but no Ingress Port is selected. Please select an Ingress Port in the Port Forwarding section.
            </Text>
          )}
          {showIngressSubdomainError && (
            <Text color="red" size="sm" mt="xs">
              Ingress Port is selected but Ingress Subdomain is disabled. Please enable Ingress Subdomain or uncheck the Ingress Port.
            </Text>
          )}
        </Paper>

        <Paper p="md" withBorder radius="md">
          <Title order={4} mb="md">
            Command & Arguments
          </Title>
          <Stack>
            {formData.command.map((arg, index) => (
              <Group key={index} grow preventGrowOverflow={false} wrap="nowrap">
                <TextInput placeholder={`Argument ${index + 1}`} value={arg} onChange={(e) => updateCommandArg(index, e.target.value)} />
                <ActionIcon color="red" variant="subtle" onClick={() => removeCommandArg(index)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addCommandArg} size="xs" w="max-content">
              Add Argument
            </Button>
          </Stack>
        </Paper>

        <Paper p="md" withBorder radius="md">
          <Title order={4} mb="md">
            Environment Variables
          </Title>
          <Stack>
            {formData.env?.map((env, index) => (
              <Group key={index} grow preventGrowOverflow={false} wrap="nowrap">
                <TextInput placeholder="Key" value={env.name} onChange={(e) => updateEnv(index, "name", e.target.value)} />
                <TextInput placeholder="Value" value={env.value} onChange={(e) => updateEnv(index, "value", e.target.value)} />
                <ActionIcon color="red" variant="subtle" onClick={() => removeEnv(index)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addEnv} size="xs" w="max-content">
              Add Variable
            </Button>
          </Stack>
        </Paper>

        <Paper p="md" withBorder radius="md">
          <Title order={4} mb="md">
            Port Forwarding
          </Title>
          <Stack>
            {formData.ports?.map((port, index) => {
              const isIngressPort = ingressConfig.port === port.container_port && port.container_port > 0;
              return (
                <Group
                  key={index}
                  grow
                  preventGrowOverflow={false}
                  wrap="nowrap"
                  style={{
                    border: isIngressPort ? "2px solid orange" : "2px solid transparent",
                    transition: "border 0.3s ease",
                    borderRadius: "4px",
                    padding: "4px",
                  }}
                >
                  <NumberInput
                    placeholder="Host Port"
                    value={port.host_port}
                    onChange={(val) => updatePort(index, "host_port", val)}
                    min={1}
                    max={65535}
                  />
                  <NumberInput
                    placeholder="Container Port"
                    value={port.container_port}
                    onChange={(val) => {
                      updatePort(index, "container_port", val);
                      // If this was the ingress port, update the ingress config too?
                      // Actually, if we change the container port, we might break the link.
                      // But let's leave it to the user to re-select if needed, OR auto-update.
                      // For now, simple behavior: link is by value. If value changes, link breaks unless we update config.
                      if (isIngressPort && typeof val === "number") {
                        handleChange("ingress_config", { ...ingressConfig, port: val });
                      }
                    }}
                    min={1}
                    max={65535}
                  />
                  <Select value={port.protocol} onChange={(val) => updatePort(index, "protocol", val)} data={["tcp", "udp"]} allowDeselect={false} />
                  <Checkbox
                    label="Ingress Port"
                    checked={isIngressPort}
                    onChange={(e) => {
                      if (e.currentTarget.checked) {
                        handleChange("ingress_config", { ...ingressConfig, port: port.container_port });
                      } else {
                        // Unchecking the port
                        handleChange("ingress_config", { ...ingressConfig, port: 0 });
                      }
                    }}
                    styles={{ label: { whiteSpace: "nowrap" } }}
                  />
                  <ActionIcon color="red" variant="subtle" onClick={() => removePort(index)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              );
            })}
            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addPort} size="xs" w="max-content">
              Add Port Mapping
            </Button>
          </Stack>
        </Paper>

        <Paper p="md" withBorder radius="md">
          <Title order={4} mb="md">
            Volumes & Mounts
          </Title>
          <Stack>
            {formData.mounts?.map((mount, index) => (
              <Group key={index} grow preventGrowOverflow={false} wrap="nowrap">
                <Group grow preventGrowOverflow={false} wrap="wrap" w="100%">
                  <TextInput
                    placeholder="Source Path (Host)"
                    value={mount.source}
                    onChange={(e) => updateMount(index, "source", e.target.value)}
                    error={mountErrors[index]?.source}
                    style={{ flex: "1 1 30%" }}
                  />
                  <TextInput
                    placeholder="Target Path (Container)"
                    value={mount.target}
                    onChange={(e) => updateMount(index, "target", e.target.value)}
                    style={{ flex: "1 1 30%" }}
                  />
                  <Select
                    value={mount.type}
                    onChange={(val) => updateMount(index, "type", val)}
                    data={["bind"]}
                    allowDeselect={false}
                    style={{ flex: "1 1 15%" }}
                  />
                </Group>
                <Checkbox
                  label="Is application directory"
                  checked={mount.is_app_directory || false}
                  onChange={(event) => updateMount(index, "is_app_directory", event.currentTarget.checked)}
                  mt="xs"
                />
                <ActionIcon color="red" variant="subtle" onClick={() => removeMount(index)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addMount} size="xs" w="max-content">
              Add Mount
            </Button>
          </Stack>
        </Paper>

        <Paper p="md" withBorder radius="md">
          <Title order={4} mb="md">
            Labels
          </Title>
          <Stack>
            {labelsList.map((label, index) => (
              <Group key={index} grow preventGrowOverflow={false} wrap="nowrap">
                <TextInput placeholder="Key" value={label.key} onChange={(e) => updateLabel(index, "key", e.target.value)} />
                <TextInput placeholder="Value" value={label.value} onChange={(e) => updateLabel(index, "value", e.target.value)} />
                <ActionIcon color="red" variant="subtle" onClick={() => removeLabel(index)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addLabel} size="xs" w="max-content">
              Add Label
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

function SimpleGridWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "var(--mantine-spacing-md)" }}>{children}</div>
  );
}
