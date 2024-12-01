export class Like {
    private likeId: number;
    private userId: number;
    private postId: number;
    private isPositive: boolean;

    constructor(
        likeId: number,
        isPositive: boolean,
        userId: number,
        postId: number
    ) {
        this.likeId = likeId;
        this.isPositive = isPositive;
        this.userId = userId;
        this.postId = postId;
    }

    public get getLikeId(): number {
        return this.likeId;
    }

    public get getIsPositive(): boolean {
        return this.isPositive;
    }

    public get getUserId(): number {
        return this.userId;
    }
}
