export class Comment {
    private commentId: number;
    private content: string;

    constructor(commentId: number, content: string) {
        this.commentId = commentId;
        this.content = content;
    }
}
