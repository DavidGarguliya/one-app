import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { TagDTO } from "@one-app/types";

@Injectable()
export class TagsService {
  private slugify(name: string) {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9а-яё-]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private readonly defaultGenres: TagDTO[] = [
    { id: "genre-pop", type: "genre", slug: "pop", name: "Pop" },
    { id: "genre-acoustic", type: "genre", slug: "acoustic", name: "Acoustic" },
    { id: "genre-cinematic", type: "genre", slug: "cinematic", name: "Cinematic" },
    { id: "genre-ballad", type: "genre", slug: "ballad", name: "Ballad" },
    { id: "genre-epic", type: "genre", slug: "epic", name: "Epic" },
    { id: "genre-jazz", type: "genre", slug: "jazz", name: "Jazz" },
    { id: "genre-classical", type: "genre", slug: "classical", name: "Classical" },
    { id: "genre-electronic", type: "genre", slug: "electronic", name: "Electronic" },
    { id: "genre-dance", type: "genre", slug: "dance", name: "Dance" },
    { id: "genre-chill-ambient", type: "genre", slug: "chill-ambient", name: "Chill / Ambient" }
  ];

  private readonly defaultTags: TagDTO[] = [
    "любовь",
    "романтика",
    "нежность",
    "страсть",
    "вдохновение",
    "надежда",
    "радость",
    "счастье",
    "праздник",
    "тепло",
    "близость",
    "семья",
    "дружба",
    "благодарность",
    "поддержка",
    "забота",
    "вера",
    "сила",
    "преодоление",
    "мотивация",
    "триумф",
    "новый_этап",
    "мечта",
    "полет",
    "свобода",
    "драйв",
    "энергия",
    "движение",
    "танец",
    "покой",
    "тишина",
    "медитация",
    "баланс",
    "спокойствие",
    "уют",
    "свет",
    "глубина",
    "искренность",
    "душевно",
    "интимно",
    "личное",
    "сердечно",
    "кинематограф",
    "атмосфера",
    "эпично",
    "минимализм",
    "современно",
    "классика",
    "стильно",
    "элегантно",
    "премиум"
  ].map((name, idx) => ({
    id: `tag-${idx + 1}`,
    type: "mood",
    slug: this.slugify(name),
    name
  }));

  private tags: TagDTO[] = [...this.defaultGenres, ...this.defaultTags];

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
