import fs from 'fs';
import path from 'path';
import { AppDataSource } from '@/config/data-source';

/**
 * Script para insertar datos iniciales en la base de datos
 * Se ejecuta después de que TypeORM cree las tablas (synchronize: true)
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Iniciando seed de base de datos...');
    console.log(`📁 __dirname actual: ${__dirname}`);
    console.log(`📁 process.cwd(): ${process.cwd()}`);

    // Intentar múltiples ubicaciones posibles
    const possiblePaths = [
      // En Docker, desde dist/scripts
      path.join(__dirname, '../../init-data.sql'),
      // En Docker, desde raíz de app
      path.join(process.cwd(), 'init-data.sql'),
      // Path absoluto en Docker
      '/app/init-data.sql',
      // Por si está en otro lugar
      path.join(__dirname, '../../../init-data.sql'),
    ];

    let initDataPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      console.log(`🔍 Buscando en: ${possiblePath}`);
      if (fs.existsSync(possiblePath)) {
        initDataPath = possiblePath;
        console.log(`✅ Encontrado en: ${possiblePath}`);
        break;
      }
    }

    if (!initDataPath) {
      console.warn(`⚠️ Archivo init-data.sql no encontrado en ninguna ubicación`);
      console.warn('⚠️ Saltando seed de datos...');
      return;
    }

    const sqlContent = fs.readFileSync(initDataPath, 'utf-8');

    // Dividir por puntos y coma para obtener sentencias individuales
    const statements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    // Ejecutar cada sentencia SQL
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      for (const statement of statements) {
        try {
          await queryRunner.query(statement);
        } catch (error: any) {
          // Si es un error de duplicado (UNIQUE constraint), ignorar
          if (error.code === 'ER_DUP_ENTRY') {
            console.log('ℹ️ Usuario ya existe (ER_DUP_ENTRY), saltando...');
          } else {
            throw error;
          }
        }
      }
      console.log('✅ Seed de base de datos completado');
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('❌ Error durante el seed de base de datos:');
    console.error(error);
    // No lanzar error, solo registrar en logs
    // La aplicación debe continuar incluso si falla el seed
  }
};
