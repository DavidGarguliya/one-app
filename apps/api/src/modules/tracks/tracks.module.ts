import { Module, forwardRef } from "@nestjs/common";
import { TracksController } from "./tracks.controller";
import { TracksService } from "./tracks.service";
import { StorageService } from "../../storage/storage.service";
import { TagsModule } from "../tags/tags.module";
import { PlaylistsModule } from "../playlists/playlists.module";

@Module({
  imports: [TagsModule, forwardRef(() => PlaylistsModule)],
  controllers: [TracksController],
  providers: [TracksService, StorageService],
  exports: [TracksService]
})
export class TracksModule {}
