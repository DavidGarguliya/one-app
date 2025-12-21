import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateMoodDto } from "./dto/create-mood.dto";
import { UpdateMoodDto } from "./dto/update-mood.dto";

interface Mood { id: string; name: string }

@Injectable()
export class MoodsService {
  private readonly defaults: Mood[] = [
    "Радость",
    "Влюблённость",
    "Праздник",
    "Лёгкость",
    "Тепло",
    "Благодарность",
    "Искренность",
    "Близость",
    "Вдохновение",
    "Надежда",
    "Любовь",
    "Нежность",
    "Тоска",
    "Признание",
    "Сила",
    "Преодоление",
    "Вера в себя",
    "Триумф",
    "Уют",
    "Игривость",
    "Шарм",
    "Свобода",
    "Спокойствие",
    "Чистота",
    "Возвышенность",
    "Вечность",
    "Драйв",
    "Мечта",
    "Полёт",
    "Покой",
    "Медитация",
    "Безопасность"
  ].map((name, idx) => ({ id: `mood-${idx + 1}`, name }));

  private moods: Mood[] = [...this.defaults];

  findAll() { return this.moods; }
  findOne(id: string) {
    const item = this.moods.find((m) => m.id === id);
    if (!item) throw new NotFoundException("Mood not found");
    return item;
  }
  create(dto: CreateMoodDto) { const mood: Mood = { id: `mood-${Date.now()}`, ...dto }; this.moods.push(mood); return mood; }
  update(id: string, dto: UpdateMoodDto) { const idx = this.moods.findIndex((m) => m.id === id); if (idx === -1) throw new NotFoundException("Mood not found"); this.moods[idx] = { ...this.moods[idx], ...dto }; return this.moods[idx]; }
  remove(id: string) { const idx = this.moods.findIndex((m) => m.id === id); if (idx === -1) throw new NotFoundException("Mood not found"); this.moods.splice(idx,1); return { success: true }; }
}
