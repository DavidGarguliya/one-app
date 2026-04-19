import { Body, Controller, Get, Param, Post, Put, Query, Delete, UploadedFile, UseInterceptors, Res, BadRequestException, Req, InternalServerErrorException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TracksService } from "./tracks.service";
import { CreateTrackDto } from "./dto/create-track.dto";
import { UpdateTrackDto } from "./dto/update-track.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { StorageService } from "../../storage/storage.service";
import { Response } from "express";
import { pipeline as nodePipeline, Readable } from "stream";
import { promisify } from "util";
import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import { URL } from "url";

const pipeline = promisify(nodePipeline);

const isAiffUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return /\.aif(f)?$/i.test(parsed.pathname);
  } catch {
    return /\.aif(f)?(\?|$)/i.test(url);
  }
};

@ApiTags("tracks")
@Controller("v1/tracks")
export class TracksController {
  constructor(private readonly tracksService: TracksService, private readonly storageService: StorageService) {}

  @Get("featured")
  featured(@Query("slim") slim?: string) {
    const item = this.tracksService.getFeatured();
    if (!item) return item;
    if (slim === "1" || slim === "true") {
      return { ...item, audioUrl: "" };
    }
    return item;
  }

  @Get("latest")
  latest(@Query("limit") limit?: string, @Query("slim") slim?: string) {
    const size = Number(limit) || 8;
    const items = this.tracksService.getLatest(size);
    if (slim === "1" || slim === "true") {
      return items.map((t) => ({ ...t, audioUrl: "" }));
    }
    return items;
  }

  @Get()
  findAll(@Query("genre") genre?: string, @Query("occasion") occasion?: string, @Query("slim") slim?: string) {
    const items = this.tracksService.findAll({ genre, occasion });
    if (slim === "1" || slim === "true") {
      return items.map((t) => ({ ...t, audioUrl: "" }));
    }
    return items;
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Query("slim") slim?: string) {
    const item = this.tracksService.findOne(id);
    if (slim === "1" || slim === "true") {
      return { ...item, audioUrl: "" };
    }
    return item;
  }

  @Get(":id/audio")
  async streamAudio(@Param("id") id: string, @Res() res: Response) {
    const track = this.tracksService.findOne(id);
    if (!track?.audioUrl) {
      throw new BadRequestException("audioUrl is missing");
    }
    // Non-data sources: transcode AIFF inline, otherwise reuse proxy for range support
    if (!track.audioUrl.startsWith("data:")) {
      const apiBase =
        (process.env.API_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000").replace(/\/$/, "");
      const isProxyUrl = track.audioUrl.includes("/v1/tracks/proxy");
      if (isProxyUrl) {
        // Avoid redirect loop when stored audioUrl уже указывает на наш proxy; просто пролетим поток.
        const upstream = await fetch(track.audioUrl, {
          headers: (res.req as any)?.headers?.range ? { Range: (res.req as any).headers.range } : undefined
        });
        if (!upstream.ok || !upstream.body) {
          throw new BadRequestException("Failed to fetch proxied audio");
        }
        const ct = upstream.headers.get("content-type");
        const cl = upstream.headers.get("content-length");
        const cr = upstream.headers.get("content-range");
        if (ct) res.setHeader("content-type", ct);
        if (cl) res.setHeader("content-length", cl);
        if (cr) res.setHeader("content-range", cr);
        if (cr || upstream.status === 206) {
          res.setHeader("accept-ranges", "bytes");
        }
        if (upstream.status) {
          res.status(upstream.status);
        }
        const readable =
          typeof (Readable as any).fromWeb === "function"
            ? (Readable as any).fromWeb(upstream.body)
            : (upstream.body as any);
        await pipeline(readable, res);
        return;
      }
      if (isAiffUrl(track.audioUrl)) {
        if (!ffmpegPath) throw new InternalServerErrorException("FFmpeg is not available");
        res.setHeader("content-type", "audio/wav");
        res.setHeader("accept-ranges", "bytes");
        await new Promise<void>((resolve, reject) => {
          const ff = spawn(ffmpegPath as string, ["-i", track.audioUrl, "-f", "wav", "-acodec", "pcm_s16le", "pipe:1"]);
          ff.on("error", reject);
          ff.stderr.on("data", () => {});
          ff.stdout.on("error", reject);
          ff.stdout.on("close", () => resolve());
          ff.stdout.pipe(res);
        }).catch(() => {
          throw new InternalServerErrorException("Failed to transcode audio");
        });
        return;
      }
      res.redirect(302, `${apiBase}/v1/tracks/proxy?url=${encodeURIComponent(track.audioUrl)}`);
      return;
    }

    const match = /^data:([^;]+);base64,(.+)$/i.exec(track.audioUrl);
    if (!match) {
      throw new BadRequestException("Invalid data URL");
    }
    const mime = match[1];
    const b64 = match[2];
    const buffer = Buffer.from(b64, "base64");

    const isAiff = /aiff/i.test(mime) || isAiffUrl(track.audioUrl);
    if (!isAiff) {
      const rangeHeader = (res.req as any)?.headers?.range as string | undefined;
      res.setHeader("content-type", mime);
      res.setHeader("accept-ranges", "bytes");
      if (rangeHeader) {
        const matchRange = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
        const start = matchRange?.[1] ? Number(matchRange[1]) : 0;
        const end = matchRange?.[2] ? Number(matchRange[2]) : buffer.length - 1;
        const safeStart = Math.max(0, Math.min(start, buffer.length - 1));
        const safeEnd = Math.max(safeStart, Math.min(end, buffer.length - 1));
        const chunk = buffer.subarray(safeStart, safeEnd + 1);
        res.status(206);
        res.setHeader("content-range", `bytes ${safeStart}-${safeEnd}/${buffer.length}`);
        res.setHeader("content-length", chunk.length.toString());
        res.send(chunk);
      } else {
        res.setHeader("content-length", buffer.length.toString());
        res.send(buffer);
      }
      return;
    }

    if (!ffmpegPath) {
      throw new InternalServerErrorException("FFmpeg is not available");
    }

    res.setHeader("content-type", "audio/wav");
    res.setHeader("accept-ranges", "bytes");
    await new Promise<void>((resolve, reject) => {
      const ff = spawn(ffmpegPath as string, ["-i", "pipe:0", "-f", "wav", "-acodec", "pcm_s16le", "pipe:1"]);
      ff.on("error", reject);
      ff.stderr.on("data", () => {});
      ff.stdout.on("error", reject);
      ff.stdout.on("close", () => resolve());
      ff.stdout.pipe(res);
      ff.stdin.write(buffer);
      ff.stdin.end();
    }).catch(() => {
      throw new InternalServerErrorException("Failed to transcode audio");
    });
  }

  @Post()
  create(@Body() dto: CreateTrackDto) {
    return this.tracksService.create(dto);
  }

  @Post("bulk")
  createBulk(@Body() dtos: CreateTrackDto[]) {
    return this.tracksService.createMany(dtos);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer) {
      return { url: null };
    }
    const mime = file.mimetype || "application/octet-stream";
    const url = await this.storageService.uploadBuffer(file.buffer, mime);
    const apiBase =
      (process.env.API_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000").replace(
        /\/$/,
        ""
      );
    const proxied = `${apiBase}/v1/tracks/proxy?url=${encodeURIComponent(url)}`;
    return { url: proxied, originalUrl: url };
  }

  @Get("proxy")
  async proxy(@Query("url") url: string, @Req() req: any, @Res() res: Response) {
    if (!url) throw new BadRequestException("url is required");
    if (this.storageService.canHandleUrl(url)) {
      await this.storageService.streamFromUrl(url, res, req.headers.range);
      return;
    }
    const upstream = await fetch(url, {
      headers: req.headers.range ? { Range: req.headers.range } : undefined
    });
    if (!upstream.ok || !upstream.body) {
      res.status(upstream.status || 502).send("Failed to fetch source");
      return;
    }
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    const status = upstream.status;
    if (contentType) res.setHeader("content-type", contentType);
    if (contentLength) res.setHeader("content-length", contentLength);
    if (contentRange) res.setHeader("content-range", contentRange);
    if (contentRange || status === 206) {
      res.setHeader("accept-ranges", "bytes");
    }
    if (status) res.status(status);
    const readable =
      typeof (Readable as any).fromWeb === "function"
        ? (Readable as any).fromWeb(upstream.body)
        : (upstream.body as any);
    await pipeline(readable, res);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTrackDto) {
    return this.tracksService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tracksService.remove(id);
  }
}
