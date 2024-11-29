import { Comment } from "./comment";
import { Like } from "./like";

export class Post {
    private postId: number;
    private content: string;
    private comments: Comment;
    private likes: Like[];
    private userId: number;
    constructor(postId: number, content: string, userId: number) {
        this.postId = postId;
        this.content = content;
        this.userId = userId;
    }

    public get getPostId() {
        return this.postId;
    }
}
