"use client";

import { Group, Box, Drawer, ScrollArea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ExplorerOperationsPanel } from "./ExplorerOperationsPanel";
import { ExplorerSidebar } from "./ExplorerSidebar";
import { ExplorerToolbar } from "./ExplorerToolbar";
import { FileList } from "./FileList";
import { ExplorerProvider } from "./ExplorerProvider";

export function ExplorerLayout() {
  const [operationsOpened, { open: openOperations, close: closeOperations }] = useDisclosure(false);

  return (
    <ExplorerProvider>
      <Group
        align="stretch"
        gap={0}
        style={{
          // height: 'calc(100vh - 60px)',
          overflow: "hidden",
        }}
      >
        {/* Assuming Header is 60px, adjust calculation based on layout */}

        <ExplorerSidebar />

            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <ExplorerToolbar onToggleOperations={openOperations} />
                <ScrollArea style={{ flex: 1, minHeight: 0 }} bg="var(--mantine-color-body)" type="auto">
                    <FileList />
                </ScrollArea>
            </Box>

        <Box visibleFrom="xl" style={{ minHeight: 0 }}>
          <ExplorerOperationsPanel />
        </Box>
      </Group>
      <Drawer opened={operationsOpened} onClose={closeOperations} title="Operations" position="right" size="sm" hiddenFrom="xl">
        <ExplorerOperationsPanel compact />
      </Drawer>
    </ExplorerProvider>
  );
}
