import { Module } from "@nestjs/common";
import { OccasionsService } from "./occasions.service";
import { OccasionsController } from "./occasions.controller";

@Module({ controllers: [OccasionsController], providers: [OccasionsService] })
export class OccasionsModule {}
