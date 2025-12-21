import { Module } from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";
import { RecommendationsController } from "./recommendations.controller";
import { TracksModule } from "../tracks/tracks.module";

@Module({
  imports: [TracksModule],
  providers: [RecommendationsService],
  controllers: [RecommendationsController]
})
export class RecommendationsModule {}
