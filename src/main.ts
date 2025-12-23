import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });
  
  // Enable CORS for frontend integration
  app.enableCors({
    origin: [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:3002',
      'https://real-time-follow-unfollow-app.vercel.app',
      /\.vercel\.app$/
    ],
    credentials: true,
  });
  
  // Enable global validation
  app.useGlobalPipes(new ValidationPipe());
  
  // Increase payload size limit
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));
  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Real-time Comment System is running on port ${port}`);
}
bootstrap();