import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { CustomBadgePlugin } from 'swagger-custom-badges';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('App example')
    .setDescription('The app API description')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory, {
    explorer: true,
    jsonDocumentUrl: `docs/json`,
    yamlDocumentUrl: `docs/yaml`,
    swaggerOptions: {
      plugins: [
        CustomBadgePlugin({
          fields: [
            {
              fieldName: 'x-roles',
              badges: {
                globalRoles: {
                  icon: '🌐',
                  background: '#E35050',
                },
                relationRoles: {
                  icon: '🔗',
                },
              },
            },
            {
              fieldName: 'x-deprecated',
              badge: {
                icon: '⚠',
                background: '#E3C250',
              },
              parser: (value: {
                reason: string;
                since: string;
                until: string;
              }) => {
                return [
                  {
                    key: 'deprecated',
                    value: `${value.reason} ${value.since} - ${value.until}`,
                  },
                ];
              },
            },
          ],
        }),
      ],
      deepLinking: true,
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
