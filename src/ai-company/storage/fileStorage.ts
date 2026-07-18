// src/storage/fileStorage.ts

import * as fs from "fs";
import * as path from "path";
import { StorageSnapshot } from "./storageTypes";

export class FileStorage {
  constructor(private filePath: string) {}

  save(snapshot: StorageSnapshot): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(snapshot, null, 2), "utf-8");
  }

  load(): StorageSnapshot | null {
    if (!fs.existsSync(this.filePath)) return null;

    const raw = fs.readFileSync(this.filePath, "utf-8");
    return JSON.parse(raw) as StorageSnapshot;
  }

  exists(): boolean {
    return fs.existsSync(this.filePath);
  }

  delete(): void {
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }
}
