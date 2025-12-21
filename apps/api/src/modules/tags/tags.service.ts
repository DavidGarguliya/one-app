import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { TagDTO } from "@one-app/types";

@Injectable()
export class TagsService {
  private tags: TagDTO[] = [];

  findAll() {
    return this.tags;
  }

  findOne(id: string) {
    const tag = this.tags.find((t) => t.id === id);
    if (!tag) throw new NotFoundException("Tag not found");
    return tag;
  }

  create(dto: CreateTagDto) {
    const tag: TagDTO = { ...dto, id: `tag-${Date.now()}` };
    this.tags.push(tag);
    return tag;
  }

  update(id: string, dto: UpdateTagDto) {
    const idx = this.tags.findIndex((t) => t.id === id);
    if (idx === -1) throw new NotFoundException("Tag not found");
    this.tags[idx] = { ...this.tags[idx], ...dto };
    return this.tags[idx];
  }

  remove(id: string) {
    const idx = this.tags.findIndex((t) => t.id === id);
    if (idx === -1) throw new NotFoundException("Tag not found");
    this.tags.splice(idx, 1);
    return { success: true };
  }
}
