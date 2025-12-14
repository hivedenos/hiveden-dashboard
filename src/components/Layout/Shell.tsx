"use client";

import { AppShell, Burger, Group, NavLink, Text, useMantineColorScheme, ActionIcon, Badge } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBrandDocker,
  IconServer,
  IconShare,
  IconInfoCircle,
  IconSun,
  IconMoon,
  IconTemplate,
  IconFileText,
  IconPackage,
  IconDatabase,
  IconFolder,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useApplicationVersion } from "@/lib/useApplicationVersion";

export function Shell({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);
  const { backendVersion, frontendVersion, isLoading } = useApplicationVersion();

  useEffect(() => {
    // Using setTimeout to avoid lint error about synchronous setState in effect
    // and to ensure this runs after hydration
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const navItems = [
    { label: "System Info", icon: IconInfoCircle, link: "/" },
    { label: "File Explorer", icon: IconFolder, link: "/files" },
    { label: "Storage", icon: IconDatabase, link: "/storage" },
    { label: "Docker", icon: IconBrandDocker, link: "/docker" },
    { label: "LXC", icon: IconServer, link: "/lxc" },
    { label: "Network Shares", icon: IconShare, link: "/shares" },
    { label: "Templates", icon: IconTemplate, link: "/templates" },
    { label: "Logs", icon: IconFileText, link: "/logs" },
  ];

  const bottomNavItems = [{ label: "Required Packages", icon: IconPackage, link: "/packages" }];

  const isFiles = pathname.startsWith("/files");
  const navbarWidth = isFiles ? 80 : 300;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: navbarWidth,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">
              Hiveden
            </Text>
          </Group>
          <Group gap="xs">
            <Badge variant="outline" color="gray">
              UI: {frontendVersion}
            </Badge>
            {!isLoading && backendVersion && (
              <Badge variant="outline" color="gray">
                API: {backendVersion}
              </Badge>
            )}
            <ActionIcon onClick={() => toggleColorScheme()} variant="default" size="lg" aria-label="Toggle color scheme">
              {mounted && (colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />)}
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.link}
              component={Link}
              href={item.link}
              label={!isFiles ? item.label : null}
              leftSection={<item.icon size="1rem" stroke={1.5} />}
              active={pathname === item.link || (item.link !== "/" && pathname.startsWith(item.link))}
              variant="light"
            />
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--mantine-color-gray-3)", paddingTop: "8px" }}>
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.link}
              component={Link}
              href={item.link}
              label={!isFiles ? item.label : null}
              leftSection={<item.icon size="1rem" stroke={1.5} />}
              active={pathname === item.link || (item.link !== "/" && pathname.startsWith(item.link))}
              variant="light"
            />
          ))}
        </div>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
