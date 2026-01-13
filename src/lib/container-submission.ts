import { createContainer } from "@/actions/docker";
import { ContainerFormState } from "@/hooks/useContainerForm";
import { ContainerCreate } from "@/lib/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export async function handleCreateContainer(formData: ContainerFormState, labelsList: { key: string; value: string }[], router: AppRouterInstance, setLoading: (loading: boolean) => void) {
  setLoading(true);
  try {
    const labelsRecord: Record<string, string> = {};
    labelsList.forEach((l) => {
      if (l.key) labelsRecord[l.key] = l.value;
    });

    // Destructure to remove form-specific fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ingressSubdomainChecked, ...restFormData } = formData;

    // Ensure ingress_config is only sent if fully valid and enabled
    const finalIngressConfig = ingressSubdomainChecked && formData.ingress_config && formData.ingress_config.port > 0 ? formData.ingress_config : null;

    const commonData = {
      ...restFormData,
      ingress_config: finalIngressConfig,
      labels: labelsRecord,
      command: formData.command.length > 0 ? formData.command : null,
    };

    const payload: ContainerCreate = {
      ...commonData,
      is_container: true,
    };
    await createContainer(payload);

    router.push("/docker/containers");
    router.refresh();
  } catch (error) {
    alert(`Failed to create container: ${(error as Error).message}`);
  } finally {
    setLoading(false);
  }
}
