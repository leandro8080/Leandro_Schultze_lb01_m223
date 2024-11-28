import { Comment } from "./comment";
import { Like } from "./like";

export class Post {
    private postId: number;
    private content: string;
    private comments: Comment;
    private likes: Like[];
    constructor(postId: number, content: string) {
        this.postId = postId;
        this.content = content;
    }
}
