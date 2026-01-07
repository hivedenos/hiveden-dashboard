import { uploadContainerFile } from "@/actions/docker";
import { getAllDevices } from "@/actions/info";
import { getComprehensiveLocations } from "@/actions/system";
import { UseContainerFormReturn } from "@/hooks/useContainerForm";
import { ActionIcon, Autocomplete, Box, Button, Checkbox, Group, NumberInput, Paper, Select, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconPlus, IconTrash, IconUpload } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { DatabaseConfig } from "./DatabaseConfig";

interface ContainerFormProps {
  form: UseContainerFormReturn;
}

export function ContainerForm({ form }: ContainerFormProps) {
  const { formData, labelsList, setLabelsList, mountErrors, handleChange, addCommandArg, removeCommandArg, updateCommandArg, addEnv, removeEnv, updateEnv, addPort, removePort, updatePort, addMount, removeMount, updateMount, addDevice, removeDevice, updateDevice, addLabel, removeLabel, updateLabel } = form;
  const isIngressSubdomainEnabled = formData.ingressSubdomainChecked;
  // Initialize config if it doesn't exist but we need it for state
  const ingressConfig = formData.ingress_config || { domain: "", port: 0 };
  const ingressPort = ingressConfig.port;

  // Validation Logic
  const showIngressPortError = isIngressSubdomainEnabled && ingressPort === 0;
  const showIngressSubdomainError = !isIngressSubdomainEnabled && ingressPort > 0;

  // Database Creation Handler
  const handleDatabaseCreated = (dbName: string) => {
    const key = "hiveden.database.name";
    const existingIndex = labelsList.findIndex(l => l.key === key);
    
    if (existingIndex >= 0) {
      updateLabel(existingIndex, "value", dbName);
    } else {
      setLabelsList(prev => [...prev, { key, value: dbName }]);
    }
  };

  const handleDatabaseFound = (dbName: string) => {
    const key = "hiveden.database.name";
    const existingIndex = labelsList.findIndex(l => l.key === key);
    
    if (existingIndex === -1) {
      setLabelsList(prev => [...prev, { key, value: dbName }]);
    }
  };

  // File Upload Logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [targetMountIndex, setTargetMountIndex] = useState<number | null>(null);

  // Devices & Locations Autocomplete Logic
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [systemLocations, setSystemLocations] = useState<string[]>([]);

  useEffect(() => {
    // Fetch Devices
    getAllDevices()
      .then((response) => {
        const data = response.data as any;
        if (data) {
          const groups: { group: string; items: string[] }[] = [];

        const addGroup = (category: string, devices: any[], usePath: boolean = false) => {
          if (!Array.isArray(devices)) return;
          const items: string[] = [];
          devices.forEach((d) => {
            if (usePath) {
              if (d.path && d.path.startsWith('/')) items.push(d.path);
            } else if (d.logical_name) {
              d.logical_name.split(',').forEach((p: string) => {
                const trimmed = p.trim();
                if (trimmed && trimmed.startsWith('/')) items.push(trimmed);
              });
            }
          });
          
          if (items.length > 0) {
            groups.push({ group: category, items: [...new Set(items)] });
          }
        };

          addGroup("Storage", data.storage, true);
          addGroup("Video", data.video);
          addGroup("USB", data.usb);
          addGroup("Network", data.network);
          addGroup("Multimedia", data.multimedia);
          addGroup("Other", data.other);

          setAvailableDevices(groups);
        }
      })
      .catch(console.error);

      // Fetch System Locations
      getComprehensiveLocations()
        .then((response) => {
            if (response.data) {
                setSystemLocations(response.data.map((l: any) => l.path));
            }
        })
        .catch(console.error);
  }, []);

  const triggerUpload = (index: number) => {
    if (!formData.name) {
      alert("Please enter a container name first.");
      return;
    }
    setTargetMountIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (targetMountIndex === null || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const index = targetMountIndex;
    setUploadingIndex(index);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await uploadContainerFile(formData.name, file.name, uploadFormData);

      // Auto-fill logic
      updateMount(index, "source", response.relative_path);
      updateMount(index, "is_app_directory", true);
      // Optional: Could focus target path here if we had a ref to it
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Failed to upload file. Please check the console for details.");
    } finally {
      setUploadingIndex(null);
      setTargetMountIndex(null);
    }
  };

  // Database Configuration Logic
  const dbNameLabel = labelsList.find(l => l.key === "hiveden.database.name");
  const databaseName = dbNameLabel?.value || formData.name;

  return (
    <Box pos="relative">
      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileSelect} />

      <Stack gap="lg">
        <Paper p="md" withBorder radius="md">
          <Group justify="space-between" mb="md">
            <Title order={4}>General Configuration</Title>
          </Group>
          <SimpleGridWrapper>
            <TextInput label="Name" placeholder="my-container" required value={formData.name} onChange={(e) => handleChange("name", e.target.value)} />
            <TextInput label="Image" placeholder="nginx:latest" required value={formData.image} onChange={(e) => handleChange("image", e.target.value)} />
          </SimpleGridWrapper>

          <Group mt="md">
            <Checkbox
              label="Ingress Subdomain"
              checked={isIngressSubdomainEnabled}
              onChange={(e) => {
                handleChange("ingressSubdomainChecked", e.currentTarget.checked);
                // Ensure ingress_config exists if we enable it
                if (e.currentTarget.checked && !formData.ingress_config) {
                  handleChange("ingress_config", { domain: formData.name, port: 0 });
                }
              }}
            />
            <Checkbox
              label="Privileged Mode"
              checked={formData.privileged || false}
              onChange={(e) => handleChange("privileged", e.currentTarget.checked)}
            />
          </Group>
          {showIngressPortError && (
            <Text c="red" size="sm" mt="xs">
              Ingress Subdomain is enabled but no Ingress Port is selected. Please select an Ingress Port in the Port Forwarding section.
            </Text>
          )}
          {showIngressSubdomainError && (
            <Text c="red" size="sm" mt="xs">
              Ingress Port is selected but Ingress Subdomain is disabled. Please enable Ingress Subdomain or uncheck the Ingress Port.
            </Text>
          )}
        </Paper>

        <DatabaseConfig 
            containerName={databaseName} 
            onDatabaseCreated={handleDatabaseCreated} 
            onDatabaseFound={handleDatabaseFound}
        />

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
                  <NumberInput placeholder="Host Port" value={port.host_port} onChange={(val) => updatePort(index, "host_port", val)} min={1} max={65535} />
                  <NumberInput
                    placeholder="Container Port"
                    value={port.container_port}
                    onChange={(val) => {
                      updatePort(index, "container_port", val);
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
              <Group key={index} grow preventGrowOverflow={false} wrap="nowrap" align="flex-start">
                <Group grow preventGrowOverflow={false} wrap="wrap" w="100%">
                  <Autocomplete
                    placeholder="Source Path (Host)"
                    value={mount.source}
                    onChange={(val) => updateMount(index, "source", val)}
                    error={mountErrors[index]?.source}
                    data={systemLocations}
                    style={{ flex: "1 1 30%" }}
                    rightSection={
                      <ActionIcon variant="subtle" color="blue" onClick={() => triggerUpload(index)} loading={uploadingIndex === index} title="Upload file">
                        <IconUpload size={16} />
                      </ActionIcon>
                    }
                  />
                  <TextInput placeholder="Target Path (Container)" value={mount.target} onChange={(e) => updateMount(index, "target", e.target.value)} style={{ flex: "1 1 30%" }} />
                  <Select value={mount.type} onChange={(val) => updateMount(index, "type", val)} data={["bind"]} allowDeselect={false} style={{ flex: "1 1 15%" }} />
                </Group>

                <Stack gap="xs">
                  <Checkbox label="Is App Dir" checked={mount.is_app_directory || false} onChange={(event) => updateMount(index, "is_app_directory", event.currentTarget.checked)} styles={{ label: { whiteSpace: "nowrap" } }} />
                  <Checkbox label="Read Only" checked={mount.read_only || false} onChange={(event) => updateMount(index, "read_only", event.currentTarget.checked)} styles={{ label: { whiteSpace: "nowrap" } }} />
                </Stack>

                <ActionIcon color="red" variant="subtle" onClick={() => removeMount(index)} mt={4}>
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
            Devices
          </Title>
                    <Stack>
                      {formData.devices?.map((device, index) => (
                        <Group key={index} grow preventGrowOverflow={false} wrap="nowrap">
                          <Autocomplete
                            placeholder="Path on Host (/dev/sda)"
                            value={device.path_on_host}
                            onChange={(val) => {
                              updateDevice(index, "path_on_host", val);
                              updateDevice(index, "path_in_container", val);
                            }}
                            data={availableDevices}
                          />
                          <TextInput
                            placeholder="Path in Container"
                            value={device.path_in_container}
                            readOnly
                            variant="filled"
                          />
                          <TextInput
                            placeholder="Permissions (rwm)" value={device.cgroup_permissions} onChange={(e) => updateDevice(index, "cgroup_permissions", e.target.value)} style={{ maxWidth: "100px" }} />
                <ActionIcon color="red" variant="subtle" onClick={() => removeDevice(index)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addDevice} size="xs" w="max-content">
              Add Device
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
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "var(--mantine-spacing-md)" }}>{children}</div>;
}