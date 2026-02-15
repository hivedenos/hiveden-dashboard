"use server";

import "@/lib/api"; // Ensure client config
import type {
  BaseResponse,
  ContainerConfigResponse,
  ContainerCreate,
  ContainerCreateResponse,
  ContainerDependencyCheckResponse,
  ContainerResponse,
  DataResponse,
  FileUploadResponse,
  ImageLayerListResponse,
  ImageListResponse,
  NetworkCreate,
  SuccessResponse,
  VolumeListResponse,
} from "@/lib/client";
import { DockerImagesService, DockerService, DockerVolumesService } from "@/lib/client";
import { revalidatePath } from "next/cache";

export async function listImages(): Promise<ImageListResponse> {
  return DockerImagesService.listImagesDockerImagesGet();
}

export async function deleteImage(imageId: string): Promise<BaseResponse> {
  const result = await DockerImagesService.deleteImageDockerImagesImageIdDelete(imageId);
  revalidatePath("/docker/images");
  return result;
}

export async function getImageLayers(imageId: string): Promise<ImageLayerListResponse> {
  return DockerImagesService.getImageLayersDockerImagesImageIdLayersGet(imageId);
}

export async function listContainers(): Promise<DataResponse> {
  return DockerService.listAllContainersDockerContainersGet();
}

export async function createContainer(container: ContainerCreate): Promise<DataResponse> {
  return DockerService.createNewContainerDockerContainersPost(container);
}

export async function checkContainerDependencies(dependencies: string[]): Promise<ContainerDependencyCheckResponse> {
  return DockerService.checkContainerDependenciesDockerContainersDependenciesCheckPost({ dependencies });
}

export async function uploadContainerFile(containerName: string, path: string, formData: FormData): Promise<FileUploadResponse> {
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    throw new Error("No valid file provided");
  }

  return DockerService.uploadContainerFileDockerContainersContainerNameFilesPost(containerName, path, { file: file });
}

export async function getContainer(containerId: string): Promise<DataResponse> {
  return DockerService.getOneContainerDockerContainersContainerIdGet(containerId);
}

export async function getContainerConfiguration(containerId: string): Promise<ContainerConfigResponse> {
  return DockerService.getContainerConfigurationDockerContainersContainerIdConfigGet(containerId);
}

export async function updateContainerConfiguration(containerId: string, config: ContainerCreate): Promise<ContainerCreateResponse> {
  const result = await DockerService.updateContainerConfigurationDockerContainersContainerIdPut(containerId, config);
  revalidatePath("/docker/containers");
  revalidatePath(`/docker/containers/${containerId}`);
  return result;
}

export async function stopContainer(containerId: string): Promise<DataResponse> {
  const result = await DockerService.stopOneContainerDockerContainersContainerIdStopPost(containerId);
  revalidatePath("/docker/containers");
  return result;
}

export async function startContainer(containerId: string): Promise<DataResponse> {
  const result = await DockerService.startOneContainerDockerContainersContainerIdStartPost(containerId);
  revalidatePath("/docker/containers");
  return result;
}

export async function restartContainer(containerId: string): Promise<ContainerResponse> {
  const result = await DockerService.restartOneContainerDockerContainersContainerIdRestartPost(containerId);
  revalidatePath("/docker/containers");
  return result;
}

export async function removeContainer(containerId: string, deleteDatabase: boolean = false, deleteVolumes: boolean = false, deleteDns: boolean = false): Promise<SuccessResponse> {
  const result = await DockerService.removeOneContainerDockerContainersContainerIdDelete(containerId, deleteDatabase, deleteVolumes, deleteDns);
  revalidatePath("/docker/containers");
  return result;
}

export async function listNetworks(): Promise<DataResponse> {
  return DockerService.listAllNetworksDockerNetworksGet();
}

export async function createNetwork(network: NetworkCreate): Promise<DataResponse> {
  return DockerService.createNewNetworkDockerNetworksPost(network);
}

export async function getNetwork(networkId: string): Promise<DataResponse> {
  return DockerService.getOneNetworkDockerNetworksNetworkIdGet(networkId);
}

export async function removeNetwork(networkId: string): Promise<SuccessResponse> {
  const result = await DockerService.removeOneNetworkDockerNetworksNetworkIdDelete(networkId);
  revalidatePath("/docker/containers");
  return result;
}

export async function listDockerVolumes(dangling?: boolean): Promise<VolumeListResponse> {
  return DockerVolumesService.listDockerVolumesDockerVolumesGet(dangling ?? null);
}

export async function deleteDockerVolume(volumeName: string): Promise<BaseResponse> {
  const result = await DockerVolumesService.deleteDockerVolumeDockerVolumesVolumeNameDelete(volumeName);
  revalidatePath("/docker/volumes");
  return result;
}
