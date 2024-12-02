export class Comment {
    private commentId: number;
    private postId: number;
    private content: string;
    private userId: number;

    constructor(
        commentId: number,
        content: string,
        postId: number,
        userId: number
    ) {
        this.commentId = commentId;
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

    public get getCommentId(): number {
        return this.commentId;
    }

    public get getContent(): string {
        return this.content;
    }

    public editComment(newContent: string): Comment {
        this.content = newContent;
        return this;
    }
}
