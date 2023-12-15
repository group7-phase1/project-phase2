import * as unzipper from 'unzipper';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { Readable } from 'stream';

interface PackageJson {
    repository?: {
        type?: string;
        url?: string;
    };
}

export async function unzipFile(fileBuffer: Buffer): Promise<string> {
    const directory = path.join(os.tmpdir(), `upload-${Date.now()}`);
    await fs.mkdir(directory, { recursive: true });

    await new Promise<void>((resolve, reject) => {
        const stream = bufferToStream(fileBuffer);
        stream.pipe(unzipper.Extract({ path: directory }))
            .on('close', resolve)
            .on('error', reject);
    });

    return directory;
}

function bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

export function extractGitHubLink(packageJson: PackageJson): string | null {
    return packageJson.repository?.url || null;
}
