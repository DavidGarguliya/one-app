import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateStyleDto } from "./dto/create-style.dto";
import { UpdateStyleDto } from "./dto/update-style.dto";

interface Style {
  id: string;
  name: string;
}

@Injectable()
export class StylesService {
  private readonly defaults: Style[] = [
    "Романтичный",
    "Лиричный",
    "Душевный",
    "Камерный",
    "Минималистичный",
    "Современный",
    "Кинематографичный",
    "Эпичный",
    "Торжественный",
    "Лёгкий",
    "Танцевальный",
    "Медитативный",
    "Атмосферный",
    "Интимный",
    "Светлый",
    "Глубокий"
  ].map((name, idx) => ({ id: `style-${idx + 1}`, name }));

  private styles: Style[] = [...this.defaults];

  findAll() {
    return this.styles;
  }

  findOne(id: string) {
    const item = this.styles.find((s) => s.id === id);
    if (!item) throw new NotFoundException("Style not found");
    return item;
  }

  create(dto: CreateStyleDto) {
    const style: Style = { id: `style-${Date.now()}`, ...dto };
    this.styles.push(style);
    return style;
  }

  update(id: string, dto: UpdateStyleDto) {
    const idx = this.styles.findIndex((s) => s.id === id);
    if (idx === -1) throw new NotFoundException("Style not found");
    this.styles[idx] = { ...this.styles[idx], ...dto };
    return this.styles[idx];
  }

  remove(id: string) {
    const idx = this.styles.findIndex((s) => s.id === id);
    if (idx === -1) throw new NotFoundException("Style not found");
    this.styles.splice(idx, 1);
    return { success: true };
  }
}
