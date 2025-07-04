import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('News Aggregator API')
    .setDescription('Swagger UI for testing')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(8000);
  console.log('🚀 Server running on http://localhost:8000');
}

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(8000);
//   console.log(app.getHttpServer()._events.request._router.stack.map((r: any) => r.route?.path).filter(Boolean));
// }

bootstrap();

