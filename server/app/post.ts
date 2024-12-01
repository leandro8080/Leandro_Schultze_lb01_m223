import { Comment } from "./comment";
import { Like } from "./like";

export class Post {
    private postId: number;
    private content: string;
    private comments: Comment[] = [];
    private likes: Like[];
    private userId: number;
    private username?: string;
    constructor(
        postId: number,
        content: string,
        userId: number,
        likes: Like[] | []
    ) {
        this.postId = postId;
        this.content = content;
        this.userId = userId;
        this.likes = likes;
    }

    public get getPostId(): number {
        return this.postId;
    }

    public get getUserId(): number {
        return this.userId;
    }

    public get getLikeAmount(): number {
        let likeAmount: number = 0;
        this.likes.forEach((like) => {
            if (Number(like.getIsPositive) === 1) likeAmount++;
        });
        return likeAmount;
    }

    public get getDislikeAmount(): number {
        let dislikeAmount: number = 0;
        this.likes.forEach((like) => {
            if (Number(like.getIsPositive) === 0) dislikeAmount++;
        });
        return dislikeAmount;
    }

    public get getLikes(): Like[] | [] {
        return this.likes;
    }

    public userHasLikedAs(userId: number): boolean | null {
        let userLike: Like | undefined;
        this.likes.forEach((like) => {
            if (like.getUserId == userId) {
                userLike = like;
                return;
            }
        });
        if (!userLike) return null;
        if (userLike.getIsPositive) return true;
        return false;
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

    public addLike = (likeId: number, userId: number, isPositive: boolean) => {
        const like = new Like(likeId, isPositive, userId, this.postId);
        this.likes.push(like);
    };
}
