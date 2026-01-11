"use client";

import { useApplicationVersion } from "@/lib/useApplicationVersion";
import { ActionIcon, AppShell, Badge, Burger, Group, ScrollArea, Text, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBrandDocker, IconDatabase, IconFileText, IconFolder, IconInfoCircle, IconMoon, IconPackage, IconServer, IconSettings, IconShare, IconSun, IconTemplate } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LinksGroup } from "./LinksGroup";
import classes from "./Shell.module.css";

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
    {
      label: "Docker",
      icon: IconBrandDocker,
      link: "/docker/containers",
      links: [
        { label: "Containers", link: "/docker/containers" },
        { label: "Images", link: "/docker/images" },
      ],
    },
    { label: "LXC", icon: IconServer, link: "/lxc" },
    {
      label: "Network Shares",
      icon: IconShare,
      link: "/shares/smb",
      links: [
        { label: "SMB", link: "/shares/smb" },
        { label: "NFS", link: "/shares/nfs" },
      ],
    },
    { label: "Templates", icon: IconTemplate, link: "/templates" },
    { label: "Logs", icon: IconFileText, link: "/logs" },
    { label: "System Config", icon: IconSettings, link: "/system" },
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

      <AppShell.Navbar className={classes.navbar}>
        <ScrollArea className={classes.links}>
          <div className={classes.linksInner}>
            {navItems.map((item) => (
              <LinksGroup key={item.label} {...item} isCollapsed={isFiles} />
            ))}
          </div>
        </ScrollArea>

        <div className={classes.footer}>
          {bottomNavItems.map((item) => (
            <LinksGroup key={item.label} {...item} isCollapsed={isFiles} />
          ))}
        </div>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
