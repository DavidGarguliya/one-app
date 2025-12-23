import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Client } from "minio";
import { randomUUID } from "crypto";
import { createReadStream } from "fs";

@Injectable()
export class StorageService {
  private client: Client;
  private bucket: string;
  private ready: Promise<void>;

  constructor() {
    this.bucket = process.env.S3_BUCKET || "oneapp";

    // Parse endpoint to avoid passing port in endPoint (MinIO client rejects when port is duplicated)
    const endpointEnv = process.env.S3_ENDPOINT || "http://localhost:9000";
    const parsed = new URL(endpointEnv);

    this.client = new Client({
      endPoint: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : parsed.protocol === "https:" ? 443 : 80,
      useSSL: parsed.protocol === "https:",
      accessKey: process.env.S3_ACCESS_KEY || "minio",
      secretKey: process.env.S3_SECRET_KEY || "minio123"
    });

    this.ready = this.ensureBucket();
  }

  private async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucket).catch(() => false);
    if (!exists) {
      await this.client.makeBucket(this.bucket, "");
    }
  }

  async uploadLocalFile(path: string, mime: string) {
    await this.ready;
    const key = `${randomUUID()}`;
    const stream = createReadStream(path);
    try {
      await this.client.putObject(this.bucket, key, stream, undefined, { "Content-Type": mime });
      return `${process.env.S3_ENDPOINT || "http://localhost:9000"}/${this.bucket}/${key}`;
    } catch (e) {
      throw new InternalServerErrorException("Failed to upload to storage");
    }
  }

  async uploadBuffer(buffer: Buffer, mime: string) {
    await this.ready;
    const key = `${randomUUID()}`;
    try {
      await this.client.putObject(this.bucket, key, buffer, buffer.length, { "Content-Type": mime });
      return `${process.env.S3_ENDPOINT || "http://localhost:9000"}/${this.bucket}/${key}`;
    } catch (e) {
      throw new InternalServerErrorException("Failed to upload to storage");
    }
  }
}
