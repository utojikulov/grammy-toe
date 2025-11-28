import { config } from "dotenv";

type DatabaseConfig = {
    host: string;
    port: number;
    user: string;
    password: string;
};

export class ConfigService {
    private readonly env: Record<string, string | undefined>;

    constructor() {
        const { error, parsed } = config();
        if (error) {
            throw new Error("File .env not found");
        }
        if (!parsed) {
            throw new Error("Empty .env file");
        }
        this.env = parsed;
    }

    private getEnv(key: string, required = true): string {
        const value = this.env[key] ?? process.env[key];
        if (required && (value === undefined || value === "")) {
            throw new Error(`Config error: missing env variable ${key}`);
        }
        return value!;
    }

    get database(): DatabaseConfig {
        return {
            host: this.getEnv("PSQL_HOST"),
            port: Number(this.getEnv("PSQL_PORT")),
            user: this.getEnv("PSQL_USER"),
            password: this.getEnv("PSQL_PWD"),
        };
    }

    // telegram
    get telegram() {
        return {
            bot_api: this.getEnv("TELEGRAM_BOT_API"),
        };
    }
}
