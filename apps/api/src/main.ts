import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  // Bulk upload with base64 payloads can exceed defaults; allow larger bodies.
  app.use(json({ limit: "500mb" }));
  app.use(urlencoded({ limit: "500mb", extended: true }));
  const origins = [
    process.env.WEB_ORIGIN,
    process.env.ADMIN_ORIGIN,
    "http://localhost:3000",
    "http://localhost:3001"
  ].filter(Boolean) as string[];
  app.enableCors({
    origin: origins,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true
    })
  );

  const config = new DocumentBuilder()
    .setTitle("One App API")
    .setDescription("Audio service REST API v1")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
