import { Request, Response, Express } from "express";
import { Database } from "../database/database";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../app/user";
import { Post } from "../app/post";
import { Comment } from "../app/comment";
import { Like } from "../app/like";
import { query, body, matchedData, validationResult } from "express-validator";
import aesEncryption from "aes-encryption";
import * as dotenv from "dotenv";
dotenv.config();

const aes = new aesEncryption();
aes.setSecretKey(process.env.AESSECRETKEY);

export class API {
    // Properties
    app: Express;
    db: Database;
    jwtSecretKey = process.env.jwtSecretKey;
    loggedInUsers: User[];
    createdPosts: Post[];
    createdComments: Comment[];
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
                .withMessage("Tweet is to long")
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
        this.app.put(
            "/api/tweets",
            this.verifyToken,
            body("postId")
                .isInt({ min: 1 })
                .withMessage("ID must be a number greater than or equal to 1"),
            body("newContent")
                .trim()
                .notEmpty()
                .withMessage("Tweet is empty")
                .isString()
                .withMessage("Tweet must be a string")
                .isLength({ max: 400 })
                .withMessage("Tweet is to long")
                .escape(),
            this.editTweet
        );
        this.app.delete(
            "/api/tweets",
            this.verifyToken,
            query("postId")
                .isInt({ min: 1 })
                .withMessage(
                    "postId must be a number greater than or equal to 1"
                ),
            this.deleteTweet
        );
        this.app.post(
            "/api/comments",
            this.verifyToken,
            body("content")
                .trim()
                .notEmpty()
                .withMessage("Comment is empty")
                .isString()
                .withMessage("Comment must be a string")
                .isLength({ max: 400 })
                .withMessage("Comment is to long")
                .escape(),
            body("postId")
                .isInt({ min: 1 })
                .withMessage(
                    "postId must be a number greater than or equal to 1"
                ),
            this.createComment
        );
        this.app.get(
            "/api/comments",
            this.verifyToken,
            query("postId")
                .isInt({ min: 1 })
                .withMessage(
                    "postId must be a number greater than or equal to 1"
                ),
            this.getComments
        );
        this.app.post(
            "/api/likes",
            this.verifyToken,
            body("postId")
                .isInt({ min: 1 })
                .withMessage(
                    "postId must be a number greater than or equal to 1"
                ),
            body("isPositive")
                .isBoolean()
                .withMessage("isPositive must be a boolean"),
            this.setLike
        );
        this.app.get(
            "/api/likes",
            this.verifyToken,
            query("postId")
                .isInt({ min: 1 })
                .withMessage(
                    "postId must be a number greater than or equal to 1"
                ),
            this.getLikes
        );
        this.app.get("/api/role", this.verifyToken, this.getRole);
        this.app.get("/api/userId", this.verifyToken, this.getUserId);
        this.loggedInUsers = [];

        this.createdPosts = [];
        this.createdComments = [];
        this.fillCreatedPosts();
        this.fillCreatedComments();
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
            user.postTweet;
            this.createdPosts.push(newPost);

            return res.sendStatus(200);
        } catch (e) {
            console.log(e);
            return res.sendStatus(500);
        }
    };

    private editTweet = async (req: Request, res: Response): Promise<any> => {
        try {
            const validationRes = validationResult(req);
            if (!validationRes.isEmpty()) {
                return res.status(400).send(validationRes.array()[0].msg);
            }

            const { postId, newContent } = matchedData(req);
            const { userId } = req.body;

            const post = await this.getPostById(Number(postId));
            const user = await this.createUserIfUndefined(userId);

            if (!post)
                return res.status(400).send("Post with postId doesn't exist");

            if (post.getContent === newContent)
                return res.status(400).send("Tweet didn't change");
            if (userId === post.getUserId || user.getRole !== "user") {
                const updateQuery = `UPDATE posts SET content = "${newContent}" WHERE id = ${postId}`;
                await this.db.executeSQL(updateQuery);
                post.editPost(newContent);
                return res.sendStatus(200);
            }
            return res.sendStatus(401);
        } catch (e) {
            console.log(e);
            return res.sendStatus(500);
        }
    };

    private deleteTweet = async (req: Request, res: Response): Promise<any> => {
        try {
            const validationRes = validationResult(req);
            if (!validationRes.isEmpty()) {
                return res.status(400).send(validationRes.array()[0].msg);
            }

            const { postId } = matchedData(req);

            const post = this.getPostById(postId);
            if (!post) return res.status(400).send("Post doesn't exist");

            const query = `DELETE FROM posts WHERE id = ${postId};`;

            await this.db.executeSQL(query);
            this.createdPosts.splice(postId, 1);

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
                const post = await this.createPostIfUndefined(numberId);
                const user = await this.createUserIfUndefined(post.getUserId);
                const tweetWithUsername = {
                    ...post,
                    username: user.getUsername,
                };

                return res.status(200).send(tweetWithUsername);
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

    private createComment = async (
        req: Request,
        res: Response
    ): Promise<any> => {
        try {
            const validationRes = validationResult(req);
            if (!validationRes.isEmpty()) {
                return res.status(400).send(validationRes.array()[0].msg);
            }

            const { content, postId } = matchedData(req);
            const post = await this.getPostById(Number(postId));
            if (!post)
                return res.status(400).send("Post with postId doesn't exist");
            const { userId } = req.body;
            const user = await this.createUserIfUndefined(Number(userId));

            const query = `INSERT INTO comments (userId, postId, content) VALUES (${userId}, "${postId}", "${content}")`;
            const result = await this.db.executeSQL(query);
            const commentId = Number(result.insertId);
            const newComment = post.addComment(
                commentId,
                content,
                Number(userId)
            );
            user.postComment(commentId, content, postId);
            this.createdComments.push(newComment);

            return res.sendStatus(200);
        } catch (e) {
            console.log(e);
            return res.sendStatus(500);
        }
    };

    private getComments = async (req: Request, res: Response): Promise<any> => {
        try {
            const validationRes = validationResult(req);
            if (!validationRes.isEmpty()) {
                return res.status(400).send(validationRes.array()[0].msg);
            }
            const { postId } = req.query;
            const comments = this.getCommentsByPostId(Number(postId));
            const commentsWithUsername = await Promise.all(
                comments.map(async (comment: Comment) => {
                    const user = await this.createUserIfUndefined(
                        comment.getUserId
                    );
                    return {
                        ...comment,
                        username: user.getUsername,
                    };
                })
            );
            return res.status(200).send(commentsWithUsername);
        } catch (e) {
            console.log(e);
            return res.sendStatus(500);
        }
    };

    private setLike = async (req: Request, res: Response): Promise<any> => {
        try {
            const validationRes = validationResult(req);
            if (!validationRes.isEmpty()) {
                return res.status(400).send(validationRes.array()[0].msg);
            }

            const { postId, isPositive } = matchedData(req);
            const { userId } = req.body;

            const selectQuery = `SELECT id, isPositive FROM likes WHERE postId = ${postId} AND userId = ${userId};`;
            const existingLikes = await this.db.executeSQL(selectQuery);
            const post = await this.getPostById(Number(postId));
            if (!post)
                return res.status(400).send("Post with postId doesn't exist");
            if (existingLikes.length > 0) {
                const deleteLikeQuery = `DELETE FROM likes WHERE postId = ${postId} AND userId = ${userId};`;
                await this.db.executeSQL(deleteLikeQuery);
                const newLike = existingLikes[0];
                post.removeLike(newLike.id);
                if (existingLikes[0].isPositive === Number(isPositive))
                    return res.sendStatus(200);
            }

            const createLikeQuery = `INSERT INTO likes (postId, userid, isPositive) VALUES (${postId}, ${userId}, ${isPositive});`;
            const result = await this.db.executeSQL(createLikeQuery);
            const likeId = Number(result.insertId);
            post.addLike(likeId, Number(userId), isPositive);
            return res.sendStatus(200);
        } catch (e) {
            console.log(e);
            return res.sendStatus(500);
        }
    };

    private getLikes = async (req: Request, res: Response): Promise<any> => {
        try {
            const validationRes = validationResult(req);
            if (!validationRes.isEmpty()) {
                return res.status(400).send(validationRes.array()[0].msg);
            }

            const { postId } = matchedData(req);
            const { userId } = req.body;

            const user = await this.createUserIfUndefined(userId);
            const post = await this.getPostById(Number(postId));
            if (!post)
                return res.status(400).send("Post with postId doesn't exist");

            const likeAmount = post.getLikeAmount;
            const dislikeAmount = post.getDislikeAmount;
            type HasLiked = boolean | null; // True is like, false dislike and null not liked or disliked5t55trgg
            const hasLikedWith: HasLiked = post.userHasLikedAs(user.getUserId);
            return res
                .status(200)
                .send({ likeAmount, dislikeAmount, hasLikedWith });
        } catch (e) {
            console.log(e);
            return res.sendStatus(500);
        }
    };

    private getRole = async (req: Request, res: Response): Promise<any> => {
        try {
            const { userId } = req.body;
            const user = await this.createUserIfUndefined(userId);
            const role = user.getRole;
            return res.status(200).send(role);
        } catch (e) {
            console.log(e);
            return res.sendStatus(500);
        }
    };

    private getUserId = async (req: Request, res: Response): Promise<any> => {
        try {
            const { userId } = req.body;
            return res.status(200).send({ userId: userId });
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

    private getCommentsByPostId = (postId: number): Comment[] | [] => {
        let result: Comment[] = [];
        this.createdComments.forEach((comment) => {
            if (comment.getPostId === postId) {
                result.push(comment);
            }
        });
        return result;
    };

    private createUserIfUndefined = async (userId: number): Promise<User> => {
        let user: User | undefined = this.getUserObjectById(userId);
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

    private createPostIfUndefined = async (postId: number): Promise<Post> => {
        let post: Post | undefined = await this.getPostById(postId);
        if (post === undefined) {
            const query = `SELECT content, userId FROM posts WHERE id = ${postId};`;
            const result = await this.db.executeSQL(query);
            const content = result[0].content;
            const userId = result[0].userId;
            const likes = await this.getLikesByPostId(postId);
            post = new Post(postId, content, userId, likes);
            this.createdPosts.push(post);
        }

        return post;
    };

    private getLikesByPostId = async (postId: number): Promise<Like[] | []> => {
        const query = `SELECT id, userId, postId, isPositive FROM likes WHERE postid = ${postId};`;
        const result = await this.db.executeSQL(query);
        const likeList: Like[] = [];
        result.forEach((like) => {
            const newLike = new Like(
                like.id,
                like.isPositive,
                like.userId,
                like.postId
            );
            likeList.push(newLike);
        });

        return likeList;
    };

    private fillCreatedPosts = async (): Promise<void> => {
        const query = `SELECT id, userId, content FROM posts ORDER BY id asc`;
        const response = await this.db.executeSQL(query);
        response.forEach(async (post: any) => {
            await this.createPostIfUndefined(post.id);
        });
    };

    private fillCreatedComments = async (): Promise<void> => {
        const query = `SELECT id, userId, content, postId FROM comments ORDER BY id asc`;
        const response = await this.db.executeSQL(query);
        response.forEach(async (comment: any) => {
            const user = await this.createUserIfUndefined(comment.userId);
            const post = await this.createPostIfUndefined(comment.postId);
            const newComment = post.addComment(
                comment.id,
                comment.content,
                comment.userId
            );
            user.postComment(comment.id, comment.content, comment.postId);
            if (newComment) this.createdComments.push(newComment);
        });
    };

    private getPostById = async (postId: number): Promise<Post | undefined> => {
        let result: Post | undefined = undefined;
        for (const post of this.createdPosts) {
            if (post.getPostId === postId) {
                result = post;
                break;
            }
        }
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
