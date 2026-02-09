/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BtrfsShare } from './BtrfsShare';
import type { BtrfsSubvolume } from './BtrfsSubvolume';
import type { BtrfsVolume } from './BtrfsVolume';
import type { Container } from './Container';
import type { Disk } from './Disk';
import type { DiskDetail } from './DiskDetail';
import type { DNSConfigResponse } from './DNSConfigResponse';
import type { DomainInfoResponse } from './DomainInfoResponse';
import type { DomainUpdateResponse } from './DomainUpdateResponse';
import type { HWInfo } from './HWInfo';
import type { JobInfo } from './JobInfo';
import type { LXCContainer } from './LXCContainer';
import type { MetricsConfigResponse } from './MetricsConfigResponse';
import type { Network } from './Network';
import type { OSInfo } from './OSInfo';
import type { PackageStatus } from './PackageStatus';
import type { SMBShare } from './SMBShare';
import type { StorageStrategy } from './StorageStrategy';
import type { SystemDevices } from './SystemDevices';
import type { VersionInfo } from './VersionInfo';
import type { ZFSDataset } from './ZFSDataset';
import type { ZFSPool } from './ZFSPool';
export type DataResponse = {
    status?: string;
    message?: (string | null);
    data?: (Container | Network | DiskDetail | Disk | StorageStrategy | PackageStatus | OSInfo | HWInfo | SystemDevices | LXCContainer | ZFSPool | ZFSDataset | SMBShare | BtrfsVolume | BtrfsSubvolume | BtrfsShare | VersionInfo | JobInfo | Array<Container> | Array<Network> | Array<Disk> | Array<StorageStrategy> | Array<PackageStatus> | Array<LXCContainer> | Array<ZFSPool> | Array<ZFSDataset> | Array<SMBShare> | Array<BtrfsVolume> | Array<BtrfsSubvolume> | Array<BtrfsShare> | Array<string> | Record<string, any> | DomainInfoResponse | DomainUpdateResponse | DNSConfigResponse | MetricsConfigResponse | null);
};

