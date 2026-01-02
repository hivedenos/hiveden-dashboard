import { useState } from 'react';
import { ContainerCreate, EnvVar, Port, Mount, Device } from '@/lib/client';

export type ContainerFormState = Omit<ContainerCreate, 'command'> & {
  command: string[];
  ingressSubdomainChecked: boolean;
};

export interface UseContainerFormReturn {
  formData: ContainerFormState;
  setFormData: React.Dispatch<React.SetStateAction<ContainerFormState>>;
  labelsList: { key: string; value: string }[];
  setLabelsList: React.Dispatch<React.SetStateAction<{ key: string; value: string }[]>>;
  mountErrors: Record<number, { source?: string }>;
  handleChange: (field: keyof ContainerFormState, value: unknown) => void;
  // Command
  addCommandArg: () => void;
  removeCommandArg: (index: number) => void;
  updateCommandArg: (index: number, value: string) => void;
  // Env
  addEnv: () => void;
  removeEnv: (index: number) => void;
  updateEnv: (index: number, field: keyof EnvVar, value: string) => void;
  // Port
  addPort: () => void;
  removePort: (index: number) => void;
  updatePort: (index: number, field: keyof Port, value: unknown) => void;
  // Mount
  addMount: () => void;
  removeMount: (index: number) => void;
  updateMount: (index: number, field: keyof Mount, value: unknown) => void;
  // Device
  addDevice: () => void;
  removeDevice: (index: number) => void;
  updateDevice: (index: number, field: keyof Device, value: unknown) => void;
  // Label
  addLabel: () => void;
  removeLabel: (index: number) => void;
  updateLabel: (index: number, field: 'key' | 'value', value: string) => void;
}

export function useContainerForm(initialValues?: Partial<ContainerFormState>): UseContainerFormReturn {
  const [formData, setFormData] = useState<ContainerFormState>({
    name: '',
    image: '',
    command: [],
    env: [],
    ports: [],
    mounts: [],
    devices: [],
    labels: {},
    enabled: true,
    ingressSubdomainChecked: !!initialValues?.ingress_config,
    ...initialValues,
  });

  const [labelsList, setLabelsList] = useState<{ key: string; value: string }[]>(() => {
    if (initialValues?.labels) {
      return Object.entries(initialValues.labels).map(([key, value]) => ({ key, value }));
    }
    return [];
  });

  // Validation Helper
  const validateMounts = (mounts: Mount[]) => {
      const errors: Record<number, { source?: string }> = {};
      mounts.forEach((mount, index) => {
          if (mount.source) {
              if (mount.is_app_directory) {
                  // If is_app_directory is true, only allow relative paths
                  if (mount.source.startsWith('/')) {
                      errors[index] = { source: 'Source path must be relative for application directories' };
                  }
              } else {
                  // If is_app_directory is false (or undefined), only allow absolute paths
                  if (!mount.source.startsWith('/')) {
                      errors[index] = { source: 'Source path must be absolute for system mounts' };
                  }
              }
          }
      });
      return errors;
  };

  const [mountErrors, setMountErrors] = useState<Record<number, { source?: string }>>(() => {
     return validateMounts(initialValues?.mounts || []);
  });

  // Helper to update simple fields
  const handleChange = (field: keyof ContainerFormState, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Command List Helpers
  const addCommandArg = () => {
    setFormData(prev => ({ ...prev, command: [...prev.command, ''] }));
  };

  const removeCommandArg = (index: number) => {
    setFormData(prev => ({ ...prev, command: prev.command.filter((_, i) => i !== index) }));
  };

  const updateCommandArg = (index: number, value: string) => {
    setFormData(prev => {
      const newCommand = [...prev.command];
      newCommand[index] = value;
      return { ...prev, command: newCommand };
    });
  };

  // Dynamic List Helpers
  const addEnv = () => {
    setFormData(prev => ({ ...prev, env: [...(prev.env || []), { name: '', value: '' }] }));
  };

  const removeEnv = (index: number) => {
    setFormData(prev => ({ ...prev, env: (prev.env || []).filter((_, i) => i !== index) }));
  };

  const updateEnv = (index: number, field: keyof EnvVar, value: string) => {
    setFormData(prev => {
      const newEnv = [...(prev.env || [])];
      newEnv[index] = { ...newEnv[index], [field]: value };
      return { ...prev, env: newEnv };
    });
  };

  const addPort = () => {
    setFormData(prev => ({ ...prev, ports: [...(prev.ports || []), { host_port: 0, container_port: 0, protocol: 'tcp' }] }));
  };

  const removePort = (index: number) => {
    setFormData(prev => ({ ...prev, ports: (prev.ports || []).filter((_, i) => i !== index) }));
  };

  const updatePort = (index: number, field: keyof Port, value: unknown) => {
    setFormData(prev => {
      const newPorts = [...(prev.ports || [])];
      newPorts[index] = { ...newPorts[index], [field]: value };
      return { ...prev, ports: newPorts };
    });
  };

  const addMount = () => {
    setFormData(prev => ({ ...prev, mounts: [...(prev.mounts || []), { source: '', target: '', type: 'bind' }] }));
  };

  const removeMount = (index: number) => {
    setFormData(prev => {
        const newMounts = prev.mounts?.filter((_, i) => i !== index) || [];
        setMountErrors(validateMounts(newMounts));
        return { ...prev, mounts: newMounts };
    });
  };

  const updateMount = (index: number, field: keyof Mount, value: unknown) => {
    setFormData(prev => {
      const newMounts = [...(prev.mounts || [])];
      newMounts[index] = { ...newMounts[index], [field]: value };

      // Update validation for specific field or re-validate all
      if (field === 'source' || field === 'is_app_directory') {
         // Optimistic update of errors for better perf than revalidating all
         // But revalidating all is safer to keep in sync.
         // Let's use the helper to ensure consistency
         setMountErrors(validateMounts(newMounts));
      }

      return { ...prev, mounts: newMounts };
    });
  };

  const addDevice = () => {
    setFormData(prev => ({ ...prev, devices: [...(prev.devices || []), { path_on_host: '', path_in_container: '', cgroup_permissions: 'rwm' }] }));
  };

  const removeDevice = (index: number) => {
    setFormData(prev => ({ ...prev, devices: (prev.devices || []).filter((_, i) => i !== index) }));
  };

  const updateDevice = (index: number, field: keyof Device, value: unknown) => {
    setFormData(prev => {
      const newDevices = [...(prev.devices || [])];
      newDevices[index] = { ...newDevices[index], [field]: value };
      return { ...prev, devices: newDevices };
    });
  };

  const addLabel = () => {
    setLabelsList(prev => [...prev, { key: '', value: '' }]);
  };

  const removeLabel = (index: number) => {
    setLabelsList(prev => prev.filter((_, i) => i !== index));
  };

  const updateLabel = (index: number, field: 'key' | 'value', value: string) => {
    setLabelsList(prev => {
      const newLabels = [...prev];
      newLabels[index] = { ...newLabels[index], [field]: value };
      return newLabels;
    });
  };

  return {
    formData,
    setFormData,
    labelsList,
    setLabelsList,
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
    addDevice,
    removeDevice,
    updateDevice,
    addLabel,
    removeLabel,
    updateLabel,
  };
}

