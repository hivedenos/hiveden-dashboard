export type UploadEntry = {
  file: File;
  relativePath: string;
};

type FileWithRelativePath = File & {
  webkitRelativePath?: string;
};

type DataTransferItemWithEntry = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntry | null;
};

function normalizeRelativePath(path: string) {
  return path.replace(/\\/g, '/').replace(/^\/+/, '');
}

function getRelativePath(file: File) {
  const candidate = (file as FileWithRelativePath).webkitRelativePath;
  return normalizeRelativePath(candidate && candidate.length > 0 ? candidate : file.name);
}

function createUploadEntry(file: File, relativePath?: string): UploadEntry {
  return {
    file,
    relativePath: normalizeRelativePath(relativePath && relativePath.length > 0 ? relativePath : getRelativePath(file)),
  };
}

export function createUploadEntriesFromFiles(files: Iterable<File>): UploadEntry[] {
  return Array.from(files, (file) => createUploadEntry(file));
}

function readDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: FileSystemEntry[] = [];

    const readNextBatch = () => {
      reader.readEntries(
        (batch) => {
          if (batch.length === 0) {
            resolve(entries);
            return;
          }

          entries.push(...batch);
          readNextBatch();
        },
        (error) => reject(error),
      );
    };

    readNextBatch();
  });
}

async function collectUploadEntries(entry: FileSystemEntry, parentPath = ''): Promise<UploadEntry[]> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await new Promise<File>((resolve, reject) => {
      fileEntry.file(resolve, (error) => reject(error));
    });

    const relativePath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    return [createUploadEntry(file, relativePath)];
  }

  if (!entry.isDirectory) {
    return [];
  }

  const directoryEntry = entry as FileSystemDirectoryEntry;
  const directoryPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
  const children = await readDirectoryEntries(directoryEntry.createReader());
  const nestedEntries = await Promise.all(children.map((child) => collectUploadEntries(child, directoryPath)));
  return nestedEntries.flat();
}

export async function extractUploadEntriesFromDataTransfer(dataTransfer: DataTransfer): Promise<UploadEntry[]> {
  const items = Array.from(dataTransfer.items ?? []);
  const entryItems = items
    .map((item) => (item as DataTransferItemWithEntry).webkitGetAsEntry?.())
    .filter((entry): entry is FileSystemEntry => entry !== null && entry !== undefined);

  if (entryItems.length > 0) {
    const entries = await Promise.all(entryItems.map((entry) => collectUploadEntries(entry)));
    return entries.flat();
  }

  return createUploadEntriesFromFiles(Array.from(dataTransfer.files ?? []));
}
