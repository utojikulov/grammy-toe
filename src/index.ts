import { AppDataSource } from "./data-source";
import { ConfigService } from "./config/config.service";
import { BotModule } from "./modules/bot/bot.module";

async function bootstrap() {
    await AppDataSource.initialize();
    const configService = new ConfigService();
    const botModule = new BotModule(configService);
    await botModule.launch();
}

bootstrap().catch((error) => console.error(error));
