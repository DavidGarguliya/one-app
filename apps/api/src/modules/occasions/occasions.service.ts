import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateOccasionDto } from "./dto/create-occasion.dto";
import { UpdateOccasionDto } from "./dto/update-occasion.dto";

interface Occasion { id: string; name: string }

@Injectable()
export class OccasionsService {
  private occasions: Occasion[] = [];

  findAll() { return this.occasions; }
  findOne(id: string) { const item = this.occasions.find((o) => o.id === id); if (!item) throw new NotFoundException("Occasion not found"); return item; }
  create(dto: CreateOccasionDto) { const occasion: Occasion = { id: `occ-${Date.now()}`, ...dto }; this.occasions.push(occasion); return occasion; }
  update(id: string, dto: UpdateOccasionDto) { const idx = this.occasions.findIndex((o) => o.id === id); if (idx === -1) throw new NotFoundException("Occasion not found"); this.occasions[idx] = { ...this.occasions[idx], ...dto }; return this.occasions[idx]; }
  remove(id: string) { const idx = this.occasions.findIndex((o) => o.id === id); if (idx === -1) throw new NotFoundException("Occasion not found"); this.occasions.splice(idx,1); return { success: true }; }
}
