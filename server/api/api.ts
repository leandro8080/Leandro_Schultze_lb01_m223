import { Request, Response, Express } from "express";
import { Database } from "../database/database";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../app/user";
import { Post } from "../app/post";
import { query, body, matchedData, validationResult } from "express-validator";
import * as dotenv from "dotenv";
dotenv.config();

export class API {
    // Properties
    app: Express;
    db: Database;
    jwtSecretKey = process.env.jwtSecretKey;
    loggedInUsers: User[];
    createdPosts: Post[];
    // Constructor
    constructor(app: Express, db: Database) {
        this.app = app;
        this.db = db;
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
                .notEmpty()
                .withMessage("Username is empty")
                .matches(/^\S+$/)
                .withMessage("Username can't contain spaces")
                .isString()
                .withMessage("Username must be a string")
                .isLength({ max: 20 })
                .withMessage("Username is to long")
                .custom(async (username) => {
                    if (!(await this.usernameExists(username)))
                        throw new Error("Username already in use");
                })
                .escape(),
            body("password")
                .isLength({ min: 8 })
                .withMessage("Password must be at least 8 characters")
                .matches(/^\S+$/)
                .withMessage("Password can't contain spaces"),
            this.register
        );
        this.app.post(
            "/api/tweets",
            this.verifyToken,
            body("content")
                .trim()
                .notEmpty()
                .withMessage("Tweet is empty")
                .isString()
                .withMessage("Tweet must be a string")
                .isLength({ max: 400 })
                .withMessage("Post is to long")
                .escape(),
            this.postTweet
        );
        this.app.get(
            "/api/tweets",
            this.verifyToken,
            query("id")
                .optional()
                .isInt({ min: 1 })
                .withMessage("ID must be a number greater than or equal to 1"),
            this.getTweets
        );
        this.loggedInUsers = [];

        this.createdPosts = [];
        this.fillCreatedPosts();
    }
    // Methods

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
                    const posts = await this.getPostsByUserId(id);
                    const user = new User(
                        id,
                        username,
                        userPassword,
                        role,
                        posts || []
                    );
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
            const user = await this.createUserIfUndefined(userId);

            const query = `INSERT INTO posts (userId, content) VALUES (${userId}, "${content}")`;
            const result = await this.db.executeSQL(query);
            const postId = Number(result.insertId);
            const newPost = user.postTweet(postId, content);
            this.createdPosts.push(newPost);

            return res.sendStatus(200);
        } catch (e) {
            console.log(e);
            return res.sendStatus(500);
        }
    };

    private getTweets = async (req: Request, res: Response): Promise<any> => {
        try {
            const validationRes = validationResult(req);
            if (!validationRes.isEmpty()) {
                return res.status(400).send(validationRes.array()[0].msg);
            }
            const { id } = req.query;

            if (id) {
                const numberId = Number(id);
                const post = await this.getPostById(numberId);
                if (post) return res.status(200).send(post);
                return res.status(400).send("Id doesn't exist");
            }

            const tweetsWithUsernames = await Promise.all(
                this.createdPosts.map(async (tweet) => {
                    const user = await this.createUserIfUndefined(
                        tweet.getUserId
                    );
                    return {
                        ...tweet,
                        username: user.getUsername,
                    };
                })
            );
            return res.status(200).send(tweetsWithUsernames.reverse());
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

    private getPostsByUserId = async (
        userId: number
    ): Promise<Post[] | null> => {
        const query = `SELECT id, content FROM posts WHERE userId = ${userId};`;
        const response = await this.db.executeSQL(query);
        if (response.length === 0) return null;
        return response;
    };

    private createUserIfUndefined = async (userId: number): Promise<User> => {
        let user = this.getUserObjectById(userId);
        if (user === undefined) {
            const posts = await this.getPostsByUserId(userId);
            const query = `SELECT username, password, role FROM users WHERE id = ${userId};`;
            const result = await this.db.executeSQL(query);
            const username = result[0].username;
            const password = result[0].password;
            const role = result[0].role;
            user = new User(userId, username, password, role, posts || []);
            this.loggedInUsers.push(user);
        }

        return user;
    };

    private fillCreatedPosts = async (): Promise<void> => {
        const query = `SELECT id, userId, content FROM posts`;
        const response = await this.db.executeSQL(query);
        response.forEach(async (post: any) => {
            const user = await this.createUserIfUndefined(post.userId);
            const newPost = user.postTweet(post.id, post.content);
            if (newPost) this.createdPosts.push(newPost);
        });
    };

    private getPostById = async (postId: number): Promise<Post | undefined> => {
        let result: Post | undefined = undefined;
        this.createdPosts.forEach((post) => {
            if (post.getPostId === postId) {
                result = post;
                return;
            }
        });
        return result;
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
