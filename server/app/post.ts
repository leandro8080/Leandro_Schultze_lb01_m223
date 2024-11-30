import { Comment } from "./comment";
import { Like } from "./like";

export class Post {
    private postId: number;
    private content: string;
    private comments: Comment[] = [];
    private likes: Like[];
    private userId: number;
    private username?: string;
    constructor(postId: number, content: string, userId: number) {
        this.postId = postId;
        this.content = content;
        this.userId = userId;
    }

    public get getPostId(): number {
        return this.postId;
    }

    public get getUserId(): number {
        return this.userId;
    }

    public addComment = (
        commentId: number,
        content: string,
        userId: number
    ): Comment => {
        const comment: Comment = new Comment(
            commentId,
            content,
            Number(this.postId),
            userId
        );
        this.comments.push(comment);
        return comment;
    };
}
