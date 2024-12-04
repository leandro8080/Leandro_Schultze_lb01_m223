import express, { Express, Request, Response } from "express";
import { API } from "./api";
import http from "http";
import { resolve, dirname } from "path";
import { Database } from "./database";
import rateLimit from "express-rate-limit";

class Backend {
    // Properties
    private _app: Express;
    private _api: API;
    private _database: Database;
    private _env: string;

    // Getters
    public get app(): Express {
        return this._app;
    }

    public get api(): API {
        return this._api;
    }

    public get database(): Database {
        return this._database;
    }

    // Constructor
    constructor() {
        this._app = express();
        this._database = new Database();

        // Middlewares
        this._app.use(express.json());
        const limiter = rateLimit({
            windowMs: 60 * 1000,
            limit: 50,
            message: "Too many requests, please try again later.",
        });
        this._app.use(limiter);

        this._api = new API(this._app, this._database);
        this._env = (process.env.NODE_ENV || "development").trim();

        this.setupStaticFiles();
        this.setupRoutes();
        this.startServer();
    }

    // Methods
    private setupStaticFiles(): void {
        this._app.use(express.static("client"));
    }

    private setupRoutes(): void {
        this._app.get("/", (req: Request, res: Response) => {
            const __dirname = resolve(dirname(""));
            res.sendFile(__dirname + "/client/index.html");
        });

        this._app.get("/login", (req: Request, res: Response) => {
            const __dirname = resolve(dirname(""));
            res.sendFile(__dirname + "/client/login.html");
        });

        this._app.get("/register", (req: Request, res: Response) => {
            const __dirname = resolve(dirname(""));
            res.sendFile(__dirname + "/client/register.html");
        });

        this._app.get("/tweets/:id", (req: Request, res: Response) => {
            const __dirname = resolve(dirname(""));
            res.sendFile(__dirname + "/client/tweet.html");
        });

        this._app.get("/profile", (req: Request, res: Response) => {
            const __dirname = resolve(dirname(""));
            res.sendFile(__dirname + "/client/profile.html");
        });

        this._app.get("/my-tweets", (req: Request, res: Response) => {
            const __dirname = resolve(dirname(""));
            res.sendFile(__dirname + "/client/myTweets.html");
        });

        this._app.get("/my-replies", (req: Request, res: Response) => {
            const __dirname = resolve(dirname(""));
            res.sendFile(__dirname + "/client/myComments.html");
        });
    }

    private startServer(): void {
        if (this._env === "production") {
            http.createServer(this.app).listen(process.env.PORT || 8080, () => {
                console.log("Server is listening");
            });
        }
    }
}

const backend = new Backend();
export const viteNodeApp = backend.app;
