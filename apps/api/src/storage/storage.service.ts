import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Client } from "minio";
import { randomUUID } from "crypto";
import { createReadStream } from "fs";
import { pipeline as nodePipeline } from "stream";
import { promisify } from "util";

const pipeline = promisify(nodePipeline);

@Injectable()
export class StorageService {
  private client: Client;
  private bucket: string;
  private ready: Promise<void>;
  private endpoint: URL;

  constructor() {
    this.bucket = process.env.S3_BUCKET || "oneapp";

    // Parse endpoint to avoid passing port in endPoint (MinIO client rejects when port is duplicated)
    const endpointEnv = process.env.S3_ENDPOINT || "http://localhost:9000";
    const parsed = new URL(endpointEnv);
    this.endpoint = parsed;

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

  canHandleUrl(url: string) {
    try {
      const parsed = new URL(url);
      return parsed.hostname === this.endpoint.hostname && parsed.pathname.startsWith(`/${this.bucket}/`);
    } catch {
      return false;
    }
  }

  async streamFromUrl(url: string, res: any, rangeHeader?: string) {
    await this.ready;
    const parsed = new URL(url);
    const key = parsed.pathname.replace(`/${this.bucket}/`, "");
    const stat = await this.client.statObject(this.bucket, key);
    const total = stat.size;
    const contentType =
      (stat?.metaData?.["content-type"] as string) ||
      (stat?.metaData?.["Content-Type"] as string) ||
      (stat as any)?.contentType ||
      "application/octet-stream";
    res.setHeader("accept-ranges", "bytes");
    res.setHeader("content-type", contentType);

    if (rangeHeader) {
      const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
      const start = match && match[1] ? Number(match[1]) : 0;
      const end = match && match[2] ? Number(match[2]) : total - 1;
      const length = end - start + 1;
      res.status(206);
      res.setHeader("content-range", `bytes ${start}-${end}/${total}`);
      res.setHeader("content-length", length.toString());
      const stream = await this.client.getPartialObject(this.bucket, key, start, length);
      await pipeline(stream, res);
      return;
    }

    res.setHeader("content-length", total.toString());
    const stream = await this.client.getObject(this.bucket, key);
    await pipeline(stream, res);
  }
}
