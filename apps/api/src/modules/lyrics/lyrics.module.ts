import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LyricsController } from "./lyrics.controller";
import { LyricsProcessor } from "./lyrics.processor";
import { LyricsService } from "./lyrics.service";
import { TracksModule } from "../tracks/tracks.module";
import { StorageService } from "../../storage/storage.service";

@Module({
  imports: [ConfigModule, TracksModule],
  controllers: [LyricsController],
  providers: [LyricsService, LyricsProcessor, StorageService],
  exports: [LyricsService]
})
export class LyricsModule {}
