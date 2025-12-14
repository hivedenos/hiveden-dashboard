"use client";

import { useState } from "react";
import { PackageStatus, PackageOperation } from "@/lib/client";
import { Card, Text, Badge, Group, Button, Stack, Modal, ThemeIcon, SimpleGrid, ActionIcon, Tooltip } from "@mantine/core";
import { IconCheck, IconAlertTriangle, IconDownload, IconTrash, IconTerminal, IconRefresh } from "@tabler/icons-react";
import { Terminal } from "@/components/Terminal/Terminal";
import { ShellService } from "@/actions/shellService";
import { useRouter } from "next/navigation";

interface PackageListProps {
  initialPackages: PackageStatus[];
}

export function PackageList({ initialPackages }: PackageListProps) {
  const router = useRouter();
  const [installingPackage, setInstallingPackage] = useState<PackageStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleFix = (pkg: PackageStatus) => {
    setInstallingPackage(pkg);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setInstallingPackage(null);
    router.refresh(); // Refresh data to see updated status
  };

  const shellService = new ShellService();

  return (
    <>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {initialPackages.map((pkg) => (
          <PackageCard key={pkg.name} pkg={pkg} onFix={() => handleFix(pkg)} />
        ))}
      </SimpleGrid>

      <Modal
        opened={modalOpen}
        onClose={handleCloseModal}
        title={`Package Operation: ${installingPackage?.name}`}
        size="xl"
        closeOnClickOutside={false}
      >
        {installingPackage && (
          <div style={{ height: 500 }}>
            <Terminal
              socketFactory={() => shellService.connectToPackageInstall(installingPackage.name)}
              onClose={handleCloseModal}
              title={`Installing ${installingPackage.name}...`}
            />
          </div>
        )}
      </Modal>
    </>
  );
}

function PackageCard({ pkg, onFix }: { pkg: PackageStatus; onFix: () => void }) {
  const isMissing = pkg.operation === PackageOperation.INSTALL && !pkg.installed;
  const isForbidden = pkg.operation === PackageOperation.UNINSTALL && pkg.installed;
  const isOk = !isMissing && !isForbidden;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" align="flex-start" mb="xs">
        <div>
          <Group gap="xs" mb={4}>
            <Text fw={500} size="lg">
              {pkg.title || pkg.name}
            </Text>
            {isOk && (
              <ThemeIcon color="green" size="sm" radius="xl" variant="light">
                <IconCheck size={12} />
              </ThemeIcon>
            )}
            {isMissing && (
              <Badge color="red" leftSection={<IconAlertTriangle size={12} />}>
                Missing
              </Badge>
            )}
            {isForbidden && (
              <Badge color="orange" leftSection={<IconAlertTriangle size={12} />}>
                Forbidden
              </Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed" lineClamp={2}>
            {pkg.description}
          </Text>
        </div>
        {!isOk && (
          <Button
            size="xs"
            color={isMissing ? "blue" : "red"}
            leftSection={isMissing ? <IconDownload size={14} /> : <IconTrash size={14} />}
            onClick={onFix}
          >
            Fix
          </Button>
        )}
      </Group>

      <Group mt="md" gap="xs">
        {(pkg.tags || []).map((tag) => (
          <Badge key={tag} size="sm" variant="dot" color="gray">
            {tag}
          </Badge>
        ))}
      </Group>
    </Card>
  );
}
