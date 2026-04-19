import { BadRequestException, Controller, Get, Param, Post, Res, Body } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { GenerateLyricsDto } from "./dto/generate-lyrics.dto";
import { LyricsService } from "./lyrics.service";

@ApiTags("lyrics")
@Controller("v1/lyrics")
export class LyricsController {
  constructor(private readonly lyricsService: LyricsService) {}

  @Post("generate/:trackId")
  async generate(@Param("trackId") trackId: string, @Body() dto: GenerateLyricsDto) {
    if (!this.lyricsService.isEnabled()) {
      throw new BadRequestException("Lyrics engine is disabled");
    }
    return await this.lyricsService.requestGeneration(trackId, dto);
  }

  @Get("status/:trackId")
  status(@Param("trackId") trackId: string) {
    return this.lyricsService.getStatus(trackId);
  }

  @Get("result/:trackId")
  async result(@Param("trackId") trackId: string) {
    return await this.lyricsService.getResult(trackId);
  }

  @Get("download/:trackId/lrc")
  async downloadLrc(@Param("trackId") trackId: string, @Res() res: Response) {
    const { job, lrc } = await this.lyricsService.getLrc(trackId);
    if (!lrc) {
      throw new BadRequestException("Lyrics are not ready");
    }
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.setHeader("content-disposition", `attachment; filename=\"${trackId || job.id}.lrc\"`);
    res.send(lrc);
  }
}
