import { Request, Response, Express } from "express";
import { Database } from "../database/database";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../app/user";
import { body, matchedData, validationResult } from "express-validator";
import * as dotenv from "dotenv";
dotenv.config();

export class API {
    // Properties
    app: Express;
    db: Database;
    jwtSecretKey = process.env.jwtSecretKey;
    loggedInUsers: User[];
    // Constructor
    constructor(app: Express, db: Database) {
        this.app = app;
        this.db = db;
        this.app.get("/hello", this.sayHello);
        this.app.post(
            "/api/login",
            body("username")
                .isString()
                .withMessage("Username must be a string")
                .escape(),
            this.login
        );
        this.app.post(
            "/api/register",
            body("username")
                .isString()
                .withMessage("Username must be a string")
                .notEmpty()
                .withMessage("Username is empty")
                .custom(async (username) => {
                    if (!(await this.usernameExists(username)))
                        throw new Error("Username already in use");
                })
                .escape(),
            body("password")
                .isLength({ min: 8 })
                .withMessage("Password must be at least 8 characters"),
            this.register
        );
        this.app.post(
            "/api/tweets",
            this.verifyToken,
            body("content")
                .isString()
                .withMessage("Tweet must be a string")
                .notEmpty()
                .withMessage("Tweet is empty")
                .escape(),
            this.postTweet
        );
        this.loggedInUsers = [];
    }
    // Methods
    private sayHello(req: Request, res: Response) {
        res.send("Hello There!");
    }

    private login = async (req: Request, res: Response): Promise<any> => {
        try {
            const validationRes = validationResult(req);
            if (!validationRes.isEmpty()) {
                return res.status(400).send(validationRes.array()[0].msg);
            }

            const { username } = matchedData(req);
            const { password } = req.body;
            const query = `SELECT id, password, role FROM users WHERE username = "${username}";`;
            const result = await this.db.executeSQL(query);
            if (!result[0])
                return res.status(401).send("Username or password wrong");
            const userPassword = result[0].password;
            const match = await bcrypt.compare(password, userPassword);
            if (match) {
                const id = result[0].id;
                const token = jwt.sign(
                    {
                        expiresIn: "10d",
                        data: { id, username },
                    },
                    this.jwtSecretKey
                );
                const role = result[0].role;
                if (this.getUserObjectById(id) === undefined) {
                    const user = new User(id, username, userPassword, role);
                    this.loggedInUsers.push(user);
                }
                return res.status(200).send(token);
            }
            return res.status(401).send("Username or password wrong");
        } catch (e) {
            console.log(e);
            return res.sendStatus(500);
        }
    };

    private register = async (req: Request, res: Response): Promise<any> => {
        try {
            const validationRes = validationResult(req);
            if (!validationRes.isEmpty()) {
                return res.status(400).send(validationRes.array()[0].msg);
            }

            const { username, password } = matchedData(req);

            const hashedPassword = bcrypt.hash(password, 10);

            const query = `INSERT INTO users (username, password, role) VALUES ("${username}", "${await hashedPassword}", "user");`;
            this.db.executeSQL(query);
            return res.sendStatus(200);
        } catch (e) {
            console.log(e);
            return res.sendStatus(500);
        }
    };

    private postTweet = async (req: Request, res: Response): Promise<any> => {
        try {
            const validationRes = validationResult(req);
            if (!validationRes.isEmpty()) {
                return res.status(400).send(validationRes.array()[0].msg);
            }

            const { content } = matchedData(req);
            const { userId } = req.body;

            const query = `INSERT INTO posts (userId, content) VALUES (${userId}, "${content}")`;
            this.db.executeSQL(query);

            return res.sendStatus(200);
        } catch (e) {
            console.log(e);
            return res.sendStatus(500);
        }
    };

    private getUserObjectById(id: number): User | undefined {
        let result: User | undefined = undefined;
        this.loggedInUsers.forEach((user) => {
            if (user.getUserId === id) {
                result = user;
                return;
            }
        });
        return result;
    }

    private usernameExists = async (username: string): Promise<boolean> => {
        const query = `SELECT username FROM users WHERE username = "${username}";`;
        const response = await this.db.executeSQL(query);
        if (response.length === 0) return true;
        return false;
    };

    // Middleware

    private verifyToken = (req, res, next) => {
        const authHeader = req.headers["authorization"];
        if (!authHeader)
            return res.status(403).send("Failed to authenticate token");
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        jwt.verify(token, this.jwtSecretKey, (err, decoded) => {
            if (err) {
                return res.status(403).send("Failed to authenticate token");
            }
            const { id, username } = decoded.data;
            req.body = { ...req.body, userId: id, username: username };
            next();
        });
    };
}
