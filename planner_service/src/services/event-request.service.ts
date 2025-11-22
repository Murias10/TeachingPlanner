import { Repository } from 'typeorm';
import { EventRequest } from '../entities/event-request.entity';
import { AppDataSource } from '../config/data-source';

/**
 * Service for managing event requests from teachers
 * Handles CRUD operations and business logic for event requests
 */
export class EventRequestService {
    private eventRequestRepository: Repository<EventRequest>;

    constructor() {
        this.eventRequestRepository = AppDataSource.getRepository(EventRequest);
    }

    /**
     * Create a new event request
     */
    async create(eventRequest: Partial<EventRequest>): Promise<EventRequest> {
        const newEventRequest = this.eventRequestRepository.create(eventRequest);
        return await this.eventRequestRepository.save(newEventRequest);
    }

    /**
     * Get an event request by ID
     */
    async findById(id: string): Promise<EventRequest | null> {
        return await this.eventRequestRepository.findOne({
            where: { id },
        });
    }

    /**
     * Get all event requests with optional filters
     */
    async findAll(filters?: {
        status?: 'PENDING' | 'APPROVED' | 'REJECTED';
        calendarId?: string;
        teacherId?: string;
    }): Promise<EventRequest[]> {
        let query = this.eventRequestRepository.createQueryBuilder('er');

        if (filters?.status) {
            query = query.where('er.status = :status', { status: filters.status });
        }

        if (filters?.calendarId) {
            query = query.andWhere('er.calendarId = :calendarId', { calendarId: filters.calendarId });
        }

        if (filters?.teacherId) {
            query = query.andWhere('er.teacherId = :teacherId', { teacherId: filters.teacherId });
        }

        return await query.orderBy('er.createdAt', 'DESC').getMany();
    }

    /**
     * Get event requests by status and calendar
     */
    async findPendingByCalendar(calendarId: string): Promise<EventRequest[]> {
        return await this.eventRequestRepository.find({
            where: {
                calendarId,
                status: 'PENDING',
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }

    /**
     * Get event requests by teacher
     */
    async findByTeacher(teacherId: string): Promise<EventRequest[]> {
        return await this.eventRequestRepository.find({
            where: {
                teacherId,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }

    /**
     * Update an event request
     */
    async update(id: string, updates: Partial<EventRequest>): Promise<EventRequest | null> {
        await this.eventRequestRepository.update(id, updates);
        return await this.findById(id);
    }

    /**
     * Delete an event request
     */
    async delete(id: string): Promise<boolean> {
        const result = await this.eventRequestRepository.delete(id);
        return result.affected ? result.affected > 0 : false;
    }

    /**
     * Check if an event request exists
     */
    async exists(id: string): Promise<boolean> {
        const count = await this.eventRequestRepository.count({
            where: { id },
        });
        return count > 0;
    }
}
