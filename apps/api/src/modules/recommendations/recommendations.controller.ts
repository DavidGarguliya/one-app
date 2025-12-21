import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RecommendationsService } from "./recommendations.service";

@ApiTags("recommendations")
@Controller("v1")
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get("tracks/:id/related")
  related(@Param("id") id: string, @Query("limit") limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.recommendationsService.getRelated(id, { limit: parsedLimit });
  }

  @Get("playlists/auto")
  autoPlaylists() {
    return this.recommendationsService.getAutoPlaylists();
  }

  @Get("playlists/auto/:type/:slug")
  autoPlaylist(@Param("type") type: string, @Param("slug") slug: string) {
    const res = this.recommendationsService.getAutoPlaylist(type, slug);
    if (!res) return { tracks: [], meta: { type, slug, title: "Автоплейлист не найден" } };
    return res;
  }
}
