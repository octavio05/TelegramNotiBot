export interface Config {
    NODE_ENV: "development" | "production";
    TELEGRAM_TOKEN: string;
    TELEGRAM_CHAT_ID: number;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
}