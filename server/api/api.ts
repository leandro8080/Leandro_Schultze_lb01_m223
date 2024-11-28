import { Request, Response, Express } from "express";
import { Database } from "../database/database";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../app/user";

export class API {
    // Properties
    app: Express;
    db: Database;
    jwtSecretKey: string;
    // Constructor
    constructor(app: Express, db: Database) {
        this.app = app;
        this.jwtSecretKey = "SuperSecretKey";
        this.db = db;
        this.app.get("/hello", this.sayHello);
        this.app.post("/api/login", this.login);
    }
    // Methods
    private sayHello(req: Request, res: Response) {
        res.send("Hello There!");
    }

    private login = async (req: Request, res: Response): Promise<any> => {
        const { username, password } = req.body;
        const query = `SELECT id, password, role FROM users WHERE username = "${username}";`;
        const result = await this.db.executeSQL(query);
        if (!result[0]) return res.sendStatus(401);
        const userPassword = result[0].password;
        const match = await bcrypt.compare(password, userPassword);
        if (match) {
            const id = result[0].id;
            const token = jwt.sign(
                {
                    exp: Math.floor(Date.now() / 1000) + 60 * 60,
                    data: { id, username },
                },
                this.jwtSecretKey
            );
            const role = result[0].role;
            const user = new User(id, username, userPassword, role);
            return res.status(200).send(token);
        }
        res.sendStatus(401);
    };
}
