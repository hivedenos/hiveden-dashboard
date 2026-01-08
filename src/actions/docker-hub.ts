'use server';

interface DockerHubResult {
  name: string;
  description?: string;
  star_count?: number;
}

export async function searchDockerImages(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(`https://hub.docker.com/v2/search/repositories/?query=${query}&page_size=10`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results.map((repo: any) => repo.repo_name);
  } catch (e) {
    console.error('Docker Hub Search Error:', e);
    return [];
  }
}

export async function getDockerImageTags(imageName: string): Promise<string[]> {
  if (!imageName) return [];
  try {
    // Handle official images (e.g. 'ubuntu' -> 'library/ubuntu') for tag fetching if needed,
    // but Docker Hub API usually redirects or handles 'ubuntu' as 'library/ubuntu'.
    // Let's try direct first.
    let name = imageName;
    if (!name.includes('/')) {
        name = `library/${name}`;
    }

    const res = await fetch(`https://hub.docker.com/v2/repositories/${name}/tags?page_size=20`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results.map((tag: any) => tag.name);
  } catch (e) {
    console.error('Docker Hub Tags Error:', e);
    return [];
  }
}
