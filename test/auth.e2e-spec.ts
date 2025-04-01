import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      lastName: 'Test User',
    };

    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/local/register')
        .send(testUser)
        .expect(201);
    });

    it('should not register user with same email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/local/register')
        .send(testUser)
        .expect(400);
    });

    it('should login with registered user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/local/login')
        .send(testUser)
        .expect(200)
        .expect((res) => {
          console.log(res.body);
          expect(res.body.accessToken).toBeDefined();
          expect(res.headers['set-cookie']).toBeDefined();
        });
    });

    it('should not login with wrong credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/local/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  // describe('Protected Routes', () => {
  //   let token: string;

  //   beforeEach(async () => {
  //     // Obtener token para pruebas de rutas protegidas
  //     const response = await request(app.getHttpServer())
  //       .post('/auth/login')
  //       .send({
  //         email: 'test@example.com',
  //         password: 'password123',
  //       });

  //     token = response.body.access_token;
  //   });

  //   it('should access protected route with valid token', () => {
  //     return request(app.getHttpServer())
  //       .get('/auth/profile')
  //       .set('Authorization', `Bearer ${token}`)
  //       .expect(200);
  //   });

  //   it('should not access protected route without token', () => {
  //     return request(app.getHttpServer()).get('/auth/profile').expect(401);
  //   });
  // });
});
