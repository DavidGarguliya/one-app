import { Injectable, NotFoundException } from "@nestjs/common";
import { CreatePlaylistDto } from "./dto/create-playlist.dto";
import { UpdatePlaylistDto } from "./dto/update-playlist.dto";
import { PlaylistDTO } from "@one-app/types";

@Injectable()
export class PlaylistsService {
  private playlists: PlaylistDTO[] = [];

  findAll(): PlaylistDTO[] {
    return this.playlists;
  }

  findOne(id: string): PlaylistDTO {
    const found = this.playlists.find((p) => p.id === id);
    if (!found) throw new NotFoundException("Playlist not found");
    return found;
  }

  create(dto: CreatePlaylistDto) {
    const playlist: PlaylistDTO = {
      ...dto,
      id: `pl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: dto.status ?? "draft"
    };
    this.playlists.push(playlist);
    return playlist;
  }

  update(id: string, dto: UpdatePlaylistDto) {
    const idx = this.playlists.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundException("Playlist not found");
    this.playlists[idx] = { ...this.playlists[idx], ...dto };
    return this.playlists[idx];
  }

  remove(id: string) {
    const idx = this.playlists.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundException("Playlist not found");
    this.playlists.splice(idx, 1);
    return { success: true };
  }
}
