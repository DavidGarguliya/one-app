import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TracksModule } from "./modules/tracks/tracks.module";
import { PlaylistsModule } from "./modules/playlists/playlists.module";
import { TagsModule } from "./modules/tags/tags.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { StorageService } from "./storage/storage.service";
import { StylesModule } from "./modules/styles/styles.module";
import { MoodsModule } from "./modules/moods/moods.module";
import { OccasionsModule } from "./modules/occasions/occasions.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    TracksModule,
    PlaylistsModule,
    TagsModule,
    StylesModule,
    MoodsModule,
    OccasionsModule,
    RecommendationsModule
  ],
  providers: [StorageService]
})
export class AppModule {}
