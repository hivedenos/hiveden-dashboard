import { listApps } from "@/actions/app-store";
import { AppStoreCatalog } from "@/components/AppStore/AppStoreCatalog";
import type { AppSummary } from "@/lib/client";
import { Container, Stack, Text, Title } from "@mantine/core";

export const dynamic = "force-dynamic";

export default async function AppStorePage() {
  let apps: AppSummary[] = [];

  try {
    const response = await listApps({ limit: 200 });
    apps = response.data || [];
  } catch (error) {
    console.error("Failed to fetch app store catalog:", error);
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="md">
        <div>
          <Title order={1}>App Store</Title>
          <Text c="dimmed" size="sm">
            Browse apps by channel, review incubator candidates, and manage install or promotion workflows.
          </Text>
        </div>

        <AppStoreCatalog initialApps={apps} />
      </Stack>
    </Container>
  );
}
