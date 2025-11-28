import "reflect-metadata";
import { DataSource } from "typeorm";
import { ConfigService } from "./config/config.service";
import { User } from "./modules/user/entity/user.entity";
import { Expense } from "./modules/expense/entity/expense.entity";
import { Income } from "./modules/income/entity/income.entity";

const configService = new ConfigService();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: configService.database.host,
    port: configService.database.port,
    username: configService.database.user,
    password: configService.database.password,
    database: "postgres",
    synchronize: true,
    logging: false,
    entities: [User, Expense, Income],
    migrations: [],
    subscribers: [],
});
