'use client';

import { Button } from '@mantine/core';
import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';

export function BackButton() {
    return (
        <Button component={Link} href="/storage" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
            Back to Storage
        </Button>
    );
}
