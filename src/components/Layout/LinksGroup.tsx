'use client';

import { useState } from 'react';
import { Box, NavLink, rem, Tooltip } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import classes from './LinksGroup.module.css';

interface LinksGroupProps {
  icon: React.FC<any>;
  label: string;
  link?: string;
  initiallyOpened?: boolean;
  links?: { label: string; link: string; icon?: React.FC<any> }[];
  isCollapsed?: boolean;
}

export function LinksGroup({ icon: Icon, label, link, initiallyOpened, links, isCollapsed }: LinksGroupProps) {
  const pathname = usePathname();
  const hasLinks = Array.isArray(links) && links.length > 0;
  
  // Determine if active based on current path
  const isActive = !!(link && (link === '/' ? pathname === '/' : pathname.startsWith(link)));
  const isChildActive = hasLinks && links.some(child => pathname === child.link || pathname.startsWith(child.link));
  
  const [opened, setOpened] = useState(initiallyOpened || isChildActive);

  // If collapsed (File explorer mode), we show a simpler view
  if (isCollapsed) {
      return (
        <Tooltip label={label} position="right" withArrow>
          <NavLink
              component={Link}
              href={link || '#'}
              label={null}
              leftSection={<Icon size="1rem" stroke={1.7} />}
              active={isActive || isChildActive}
              variant="transparent"
              className={`${classes.link} ${classes.iconOnly}`}
          />
        </Tooltip>
      );
  }

  // If no children, render simple NavLink
  if (!hasLinks) {
      return (
        <NavLink
            component={Link}
            href={link || '#'}
            label={label}
            leftSection={<Icon size="1rem" stroke={1.7} />}
            active={isActive}
            variant="transparent"
            className={classes.link}
        />
      );
  }

  // Render Nested NavLink
  return (
    <NavLink
        label={label}
        leftSection={<Icon size="1rem" stroke={1.7} />}
        childrenOffset={0}
        defaultOpened={opened}
        active={isChildActive}
        variant="transparent"
        onChange={setOpened}
        className={classes.link}
    >
        <Box 
            className={classes.childContainer}
            style={{ marginLeft: rem(18), paddingLeft: rem(10) }}
        >
            {links.map((item) => (
                <NavLink
                    key={item.link}
                    component={Link}
                    href={item.link}
                    label={item.label}
                    active={pathname === item.link}
                    variant="transparent"
                    className={`${classes.link} ${classes.childLink}`}
                />
            ))}
        </Box>
    </NavLink>
  );
}
