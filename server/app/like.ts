export class Like {
    private likeId: number;
    private isPositive: boolean;

    constructor(likeId: number, isPositive: boolean) {
        this.likeId = likeId;
        this.isPositive = isPositive;
    }
}
