import { UserService } from "./user.service";
import { User } from "./entity/user.entity";

/**
 * UserModule — модуль для работы с пользователями.
 * Экспортирует сервис и сущность пользователя.
 */
export class UserModule {
    static User = User;
    static UserService = UserService;
}
