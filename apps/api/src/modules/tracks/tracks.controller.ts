import { Body, Controller, Get, Param, Post, Put, Query, Delete, UploadedFile, UseInterceptors, Res, BadRequestException, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TracksService } from "./tracks.service";
import { CreateTrackDto } from "./dto/create-track.dto";
import { UpdateTrackDto } from "./dto/update-track.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { StorageService } from "../../storage/storage.service";
import { Response } from "express";
import { pipeline as nodePipeline, Readable } from "stream";
import { promisify } from "util";

const pipeline = promisify(nodePipeline);

@ApiTags("tracks")
@Controller("v1/tracks")
export class TracksController {
  constructor(private readonly tracksService: TracksService, private readonly storageService: StorageService) {}

  @Get("featured")
  featured() {
    return this.tracksService.getFeatured();
  }

  @Get("latest")
  latest() {
    return this.tracksService.getLatest(8);
  }

  @Get()
  findAll(@Query("genre") genre?: string, @Query("occasion") occasion?: string) {
    return this.tracksService.findAll({ genre, occasion });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tracksService.findOne(id);
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
    return { url };
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
    res.setHeader("accept-ranges", "bytes");
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
