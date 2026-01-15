'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
// Using require to bypass ESM/CJS interop issues with react-grid-layout in Next.js
const RGL = require('react-grid-layout');
const ResponsiveGridLayout = RGL.Responsive;
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { 
  Box, 
  Button, 
  Group, 
  Switch, 
  NumberInput, 
  ActionIcon, 
  Paper,
  Text,
  Modal
} from '@mantine/core';
import { useDisclosure, useLocalStorage, useElementSize } from '@mantine/hooks';
import { 
  IconPlus, 
  IconX, 
  IconRestore 
} from '@tabler/icons-react';
import { WidgetRegistry, AvailableWidgets, WidgetData } from './Widgets/WidgetRegistry';
import _ from 'lodash';

interface DashboardLayoutProps {
  initialData: WidgetData;
}

interface WidgetItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  type: string;
  props?: any;
}

export function DashboardLayout({ initialData }: DashboardLayoutProps) {
  const { ref, width } = useElementSize();
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Grid Configuration
  const [cols, setCols] = useLocalStorage({ key: 'dashboard-cols', defaultValue: 2 });
  const [rowHeight, setRowHeight] = useLocalStorage({ key: 'dashboard-row-height', defaultValue: 400 });
  
  // Layout State
  const [layouts, setLayouts] = useLocalStorage<{ lg: WidgetItem[] }>({
    key: 'dashboard-layout',
    defaultValue: {
      lg: [
        { i: 'sys-info-1', x: 0, y: 0, w: 1, h: 1, type: 'neofetch' },
        { i: 'storage-1', x: 1, y: 0, w: 1, h: 1, type: 'storage_locations' },
        { i: 'metrics-1', x: 0, y: 1, w: 2, h: 1, type: 'system_metrics' },
      ],
    },
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [widgetModalOpened, { open: openWidgetModal, close: closeWidgetModal }] = useDisclosure(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLayoutChange = (currentLayout: any, allLayouts: any) => {
    // We only update the position/size of existing items, we don't want to lose the 'type' or 'props'
    const updatedLayouts = { ...allLayouts };
    
    // Map back the 'type' and 'props' from the state to the new layout
    const currentItems = layouts[currentBreakpoint as keyof typeof layouts] || [];
    const typeMap = new Map(currentItems.map(item => [item.i, item.type]));
    const propsMap = new Map(currentItems.map(item => [item.i, item.props]));

    const mergedLayout = currentLayout.map((l: any) => ({
      ...l,
      type: typeMap.get((l as any).i) || 'unknown',
      props: propsMap.get((l as any).i)
    }));

    setLayouts({
      ...updatedLayouts,
      [currentBreakpoint]: mergedLayout as unknown as WidgetItem[]
    } as any);
  };

  const handleAddWidget = (widgetId: string) => {
    const widgetConfig = AvailableWidgets.find(w => w.id === widgetId);
    if (!widgetConfig) return;

    const newId = `${widgetId}-${Date.now()}`;
    const newItem: WidgetItem = {
      i: newId,
      x: 0,
      y: Infinity, // Puts it at the bottom
      w: widgetConfig.defaultW,
      h: widgetConfig.defaultH,
      minW: widgetConfig.minW,
      minH: widgetConfig.minH,
      type: (widgetConfig as any).type || widgetId, // Use type from config if available, fallback to ID
      props: (widgetConfig as any).props,
    };

    setLayouts({
      ...layouts,
      [currentBreakpoint]: [...(layouts[currentBreakpoint as keyof typeof layouts] || []), newItem],
    });
    
    closeWidgetModal();
  };

  const handleRemoveWidget = (id: string) => {
    const currentLayout = layouts[currentBreakpoint as keyof typeof layouts] || [];
    setLayouts({
      ...layouts,
      [currentBreakpoint]: currentLayout.filter(item => item.i !== id),
    });
  };

  const handleResetLayout = () => {
    setLayouts({
        lg: [
            { i: 'sys-info-1', x: 0, y: 0, w: 1, h: 1, type: 'neofetch' },
            { i: 'storage-1', x: 1, y: 0, w: 1, h: 1, type: 'storage_locations' },
            { i: 'metrics-1', x: 0, y: 1, w: 2, h: 1, type: 'system_metrics' },
        ]
    });
    setCols(2);
    setRowHeight(400);
  };

  const renderWidget = (item: WidgetItem) => {
    const Component = WidgetRegistry[item.type];
    if (!Component) return <Text>Widget not found: {item.type}</Text>;

    // Prepare props based on widget type
    let props = { ...item.props };
    if (item.type === 'neofetch') {
      props = { 
        ...props,
        osInfo: initialData.osInfo, 
        hwInfo: initialData.hwInfo, 
        version: initialData.version 
      };
    } else if (item.type === 'storage_locations') {
      props = { ...props, locations: initialData.locations };
    }

    return (
      <div key={item.i} style={{ height: '100%' }}>
        <Paper 
            shadow="xs" 
            p={0} 
            withBorder 
            style={{ 
                height: '100%', 
                overflow: 'hidden', 
                position: 'relative',
                // Important: react-grid-layout needs the item to fill the space
                display: 'flex',
                flexDirection: 'column'
            }}
        >
          {isEditing && (
            <ActionIcon 
                color="red" 
                variant="filled" 
                size="sm" 
                radius="xl"
                style={{ 
                    position: 'absolute', 
                    top: 5, 
                    right: 5, 
                    zIndex: 100,
                    opacity: 0.8
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveWidget(item.i);
                }}
            >
                <IconX size={12} />
            </ActionIcon>
          )}
          <Box style={{ flex: 1, overflow: 'auto', height: '100%', width: '100%' }}>
             <Component {...props} style={{ height: '100%', width: '100%' }} />
          </Box>
        </Paper>
      </div>
    );
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <Box ref={ref}>
      <Group justify="space-between" mb="lg" align="flex-end">
        <Group>
            <Switch 
                label="Edit Mode" 
                checked={isEditing} 
                onChange={(event) => setIsEditing(event.currentTarget.checked)}
                size="md"
            />
             {isEditing && (
                <>
                    <NumberInput 
                        label="Columns" 
                        value={cols} 
                        onChange={(val) => setCols(Number(val) || 2)} 
                        min={1} 
                        max={12} 
                        w={80} 
                    />
                    <NumberInput 
                        label="Row Height (px)" 
                        value={rowHeight} 
                        onChange={(val) => setRowHeight(Number(val) || 200)} 
                        min={100} 
                        step={50} 
                        w={120} 
                    />
                     <Button 
                        leftSection={<IconPlus size={16} />} 
                        onClick={openWidgetModal}
                        variant="light"
                     >
                        Add Widget
                    </Button>
                    <Button 
                        leftSection={<IconRestore size={16} />} 
                        onClick={handleResetLayout}
                        variant="subtle"
                        color="gray"
                     >
                        Reset
                    </Button>
                </>
             )}
        </Group>
      </Group>

      <Box style={{ position: 'relative' }}>
        {isEditing && (
            <div 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 'calc(100% - 32px)', // Subtracting margins
                    height: '100%',
                    margin: '16px', // Matching RGL margin
                    pointerEvents: 'none',
                    zIndex: 0,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridAutoRows: `${rowHeight}px`,
                    gap: '16px', // Matching RGL margin
                }}
            >
                {Array.from({ length: cols * 10 }).map((_, i) => (
                    <div 
                        key={i} 
                        style={{ 
                            border: '2px dashed var(--mantine-color-gray-7)',
                            borderRadius: 'var(--mantine-radius-sm)',
                            opacity: 0.3
                        }} 
                    />
                ))}
            </div>
        )}
        <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: cols, md: cols, sm: 1, xs: 1, xxs: 1 }}
            rowHeight={rowHeight}
            width={width}
            onLayoutChange={handleLayoutChange}
            onBreakpointChange={setCurrentBreakpoint}
            isDraggable={isEditing}
            isResizable={isEditing}
            draggableHandle=".mantine-Paper-root"
            margin={[16, 16]}
            style={{ position: 'relative', zIndex: 1 }}
        >
            {(layouts[currentBreakpoint as keyof typeof layouts] || []).map(item => renderWidget(item))}
        </ResponsiveGridLayout>
      </Box>

      <Modal opened={widgetModalOpened} onClose={closeWidgetModal} title="Add Widget">
        <Group>
            {AvailableWidgets.map(widget => (
                <Button 
                    key={widget.id} 
                    onClick={() => handleAddWidget(widget.id)}
                    fullWidth
                    variant="outline"
                    justify="flex-start"
                >
                    {widget.label}
                </Button>
            ))}
        </Group>
      </Modal>
    </Box>
  );
}
