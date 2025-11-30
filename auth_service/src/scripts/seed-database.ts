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
    const allStatements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Total de fragmentos encontrados: ${allStatements.length}`);

    // Filtrar solo los INSERT
    const statements = allStatements.filter((stmt) => stmt.toUpperCase().startsWith('INSERT'));
    console.log(`📊 Total de INSERT encontrados: ${statements.length}`);

    // Debug: mostrar cada sentencia encontrada
    statements.forEach((stmt, index) => {
      const preview = stmt.substring(0, 100).replace(/\n/g, ' ');
      console.log(`  ${index + 1}. ${preview}...`);
    });

    // Ejecutar cada sentencia SQL
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`⏳ Ejecutando INSERT #${i + 1}/${statements.length}...`);
        try {
          await queryRunner.query(statement);
          console.log(`✅ INSERT #${i + 1} completado`);
        } catch (error: any) {
          // Si es un error de duplicado (UNIQUE constraint), ignorar
          if (error.code === 'ER_DUP_ENTRY') {
            console.log(`ℹ️ INSERT #${i + 1}: Usuario ya existe (ER_DUP_ENTRY), saltando...`);
          } else {
            console.error(`❌ Error en INSERT #${i + 1}:`, error.message);
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
