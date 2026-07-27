import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  const config = new DocumentBuilder()
    .setTitle('SaaS Platform API')
    .setDescription('The core backend API for the multi-tenant SaaS application')
    .setVersion('1.0')

    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT'},
      'JWT-auth',
    )

    .addGlobalParameters({
      in: 'header',
      required: false,
      name: 'x-tenant-id',
      description: 'The ID of the organization to isolate data',
    })
    .build();

    const document =SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api-docs', app, document);

    await app.listen(3001);
}
bootstrap();
