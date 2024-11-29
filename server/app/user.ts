import { Post } from "./post";
import { Comment } from "./comment";
import { Like } from "./like";

type Role = "admin" | "moderator" | "user";
export class User {
    private userId: number;
    private username: string;
    private password: string;
    private role: Role;
    private posts: Post[];
    private comments: Comment[];
    private likes: Like[];

    constructor(
        userId: number,
        username: string,
        password: string,
        role: Role,
        posts: Post[]
    ) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.role = role;
        this.posts = posts;
    }

    public get getUserId(): number {
        return this.userId;
    }

    public get getUsername(): string {
        return this.username;
    }

    public postTweet = (postId: number, content: string): Post => {
        const post = new Post(postId, content, this.userId);
        this.posts.push(post);
        return post;
    };
}
