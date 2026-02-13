import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('node:path');

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function createTestDataSource() {
  // Cuando se ejecuta localmente (fuera de Docker), usar localhost
  // Cuando se ejecuta en Docker, usar el nombre del contenedor
  const host = process.env.MANAGEMENT_DATABASE_HOST === 'management_database'
    ? 'localhost'
    : (process.env.MANAGEMENT_DATABASE_HOST || 'localhost');

  return new DataSource({
    type: 'mariadb',
    host,
    port: Number.parseInt(process.env.MANAGEMENT_DATABASE_PORT || '3307'),
    username: process.env.MANAGEMENT_DATABASE_USER || 'management_user',
    password: process.env.MANAGEMENT_DATABASE_PASSWORD || 'management_password',
    database: process.env.MANAGEMENT_DATABASE_DATABASE || 'management_db',
    entities: [User],
    synchronize: false,
    logging: false,
  });
}

async function seedTestUser() {
  console.log('🌱 Seeding test user for E2E tests...\n');

  const dataSource = await createTestDataSource();

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const userRepo = dataSource.getRepository(User);

    // Verificar si ya existe
    let existing = await userRepo.findOne({
      where: { email: 'admin@test.com' }
    });

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    if (existing) {
      console.log('ℹ️  Test user already exists, updating...');

      // Actualizar el usuario existente
      existing.password = hashedPassword;
      existing.name = 'E2E Test';
      existing.firstSurname = 'Admin';
      existing.secondSurname = 'User';
      existing.role = 'ADMIN'; // IMPORTANTE: debe ser en mayúsculas para que coincida con ProtectedComponent
      existing.isActive = true;
      existing.unioviUser = 'E2E_TEST_USER';

      await userRepo.save(existing);
      console.log('✅ Test user updated successfully!');
    } else {
      // Crear usuario de test
      console.log('Creating test user...');

      const testUser = userRepo.create({
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'E2E Test',
        firstSurname: 'Admin',
        secondSurname: 'User',
        role: 'ADMIN', // IMPORTANTE: debe ser en mayúsculas para que coincida con ProtectedComponent
        isActive: true,
        unioviUser: 'E2E_TEST_USER', // Marcador para identificar usuarios de test
      });

      await userRepo.save(testUser);
      console.log('✅ Test user created successfully!');
    }

    console.log('\n✅ Test user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@test.com');
    console.log('🔑 Password: Admin123!');
    console.log('👤 Role:     admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎯 You can now run E2E tests:');
    console.log('   cd ../webapp');
    console.log('   npm run test:e2e\n');

  } catch (error) {
    console.error('\n❌ Error creating test user:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed\n');
    }
  }
}

// Ejecutar
seedTestUser()
  .then(() => {
    console.log('✨ Seed completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed failed:', error);
    process.exit(1);
  });
