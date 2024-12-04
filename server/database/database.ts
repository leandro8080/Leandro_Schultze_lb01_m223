import mariadb from "mariadb";
import { Pool } from "mariadb";
import { users, posts, comments, likes } from "./schema";

export class Database {
    // Properties
    private _pool: Pool;
    // Constructor
    constructor() {
        this._pool = mariadb.createPool({
            database: process.env.DB_NAME || "minitwitter",
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "minitwitter",
            password: process.env.DB_PASSWORD || "supersecret123",
            connectionLimit: 5,
        });
        this.initializeDBSchema();
    }
    // Methods
    private initializeDBSchema = async (): Promise<void> => {
        console.log("Initializing DB schema...");
        await this.executeSQL(users);
        await this.executeSQL(posts);
        await this.executeSQL(comments);
        await this.executeSQL(likes);
    };

    public executeSQL = async (query: string): Promise<any> => {
        try {
            const conn = await this._pool.getConnection();
            const res = await conn.query(query);
            conn.end();
            return res;
        } catch (err) {
            console.log(err);
        }
    };
}
