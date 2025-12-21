import { Body, Controller, Get, Param, Post, Put, Delete } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PlaylistsService } from "./playlists.service";
import { CreatePlaylistDto } from "./dto/create-playlist.dto";
import { UpdatePlaylistDto } from "./dto/update-playlist.dto";

@ApiTags("playlists")
@Controller("v1/playlists")
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  findAll() {
    return this.playlistsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.playlistsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePlaylistDto) {
    return this.playlistsService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePlaylistDto) {
    return this.playlistsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.playlistsService.remove(id);
  }
}
