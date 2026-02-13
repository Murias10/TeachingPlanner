import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Degree } from '@/entities/degree.entity';
import { Course } from '@/entities/course.entity';
import { Classroom } from '@/entities/classroom.entity';
import { Subject } from '@/entities/subject.entity';
import { Group } from '@/entities/group.entity';
import { Calendar } from '@/entities/calendar.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { EventRequest } from '@/entities/event-request.entity';

/**
 * Limpia la base de datos de test eliminando todos los datos
 * SOLO debe estar disponible en entorno de test
 */
export const resetTestDatabase = async (req: Request, res: Response) => {
    try {
        // Verificar que estamos en entorno de test
        const nodeEnv = process.env.NODE_ENV;
        if (nodeEnv !== 'test' && nodeEnv !== 'development') {
            return res.status(403).json({
                message: 'This endpoint is only available in test or development environment'
            });
        }

        // Obtener el repositorio de datos
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Deshabilitar foreign key checks temporalmente
            await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

            // Eliminar todos los datos usando TRUNCATE (más rápido que DELETE)
            await queryRunner.query('TRUNCATE TABLE `EVENT_REQUESTS`');
            await queryRunner.query('TRUNCATE TABLE `PUNTUAL_EVENTS_GROUPS`');
            await queryRunner.query('TRUNCATE TABLE `PERIODIC_EVENTS_GROUPS`');
            await queryRunner.query('TRUNCATE TABLE `PUNTUAL_EVENTS`');
            await queryRunner.query('TRUNCATE TABLE `PERIODIC_EVENTS`');
            await queryRunner.query('TRUNCATE TABLE `DAYS`');
            await queryRunner.query('TRUNCATE TABLE `CALENDARS`');
            await queryRunner.query('TRUNCATE TABLE `GROUPS`');
            await queryRunner.query('TRUNCATE TABLE `SUBJECTS`');
            await queryRunner.query('TRUNCATE TABLE `CLASSROOMS`');
            await queryRunner.query('TRUNCATE TABLE `COURSES`');
            await queryRunner.query('TRUNCATE TABLE `DEGREES`');

            // Rehabilitar foreign key checks
            await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

            await queryRunner.commitTransaction();

            return res.status(200).json({
                message: 'Test database cleaned successfully'
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    } catch (error) {
        console.error('Error cleaning test database:', error);
        return res.status(500).json({
            message: 'Error cleaning test database',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
