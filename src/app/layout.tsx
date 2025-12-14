import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/code-highlight/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Shell } from '@/components/Layout/Shell';

export const metadata = {
  title: 'Hiveden Dashboard',
  description: 'Manage your Hiveden server',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <Notifications />
          <Shell>{children}</Shell>
        </MantineProvider>
      </body>
    </html>
  );
}
