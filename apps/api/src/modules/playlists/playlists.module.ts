import { Module, forwardRef } from "@nestjs/common";
import { PlaylistsService } from "./playlists.service";
import { PlaylistsController } from "./playlists.controller";
import { TracksModule } from "../tracks/tracks.module";
import { TagsModule } from "../tags/tags.module";

@Module({
  imports: [forwardRef(() => TracksModule), TagsModule],
  providers: [PlaylistsService],
  controllers: [PlaylistsController],
  exports: [PlaylistsService]
})
export class PlaylistsModule {}
