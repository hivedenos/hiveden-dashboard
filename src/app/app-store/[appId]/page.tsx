import { getAppDetail } from "@/actions/app-store";
import { AppDetailsView } from "@/components/AppStore/AppDetailsView";
import type { AppDetail } from "@/lib/client";
import { Alert, Container, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

export const dynamic = "force-dynamic";

interface AppDetailsPageProps {
  params: Promise<{ appId: string }>;
}

export default async function AppDetailsPage({ params }: AppDetailsPageProps) {
  const { appId } = await params;
  let appDetail: AppDetail | null = null;
  let loadError = false;

  try {
    const response = await getAppDetail(decodeURIComponent(appId));
    appDetail = response.data;
  } catch (error) {
    console.error("Failed to fetch app details:", error);
    loadError = true;
  }

  if (!appDetail || loadError) {
    return (
      <Container size="xl" py="xl">
        <Stack gap="md">
          <Title order={1}>App Details</Title>
          <Alert color="red" variant="light" icon={<IconAlertTriangle size={16} />} title="Unable to load app">
            The requested app details could not be loaded. Please return to the catalog and try again.
          </Alert>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="md">
        <div>
          <Title order={1}>{appDetail.title}</Title>
          <Text c="dimmed" size="sm">
            Review channel metadata, screenshots, and the install or promotion actions available for this app.
          </Text>
        </div>

        <AppDetailsView initialDetail={appDetail} />
      </Stack>
    </Container>
  );
}
