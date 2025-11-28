import { Repository } from "typeorm";
import { User } from "./entity/user.entity";
import { AppDataSource } from "../../data-source";

export class UserService {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    async findByTelegramId(telegramId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { telegramId } });
    }

    async findById(id: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async createOrUpdateFromTelegram(payload: {
        telegramId: string;
        username?: string;
        firstName?: string;
        lastName?: string;
    }): Promise<User> {
        let user = await this.findByTelegramId(payload.telegramId);
        if (!user) {
            user = this.userRepository.create({
                telegramId: payload.telegramId,
                username: payload.username,
                firstName: payload.firstName,
                lastName: payload.lastName,
            });
        } else {
            user.username = payload.username;
            user.firstName = payload.firstName;
            user.lastName = payload.lastName;
        }
        return this.userRepository.save(user);
    }
}
