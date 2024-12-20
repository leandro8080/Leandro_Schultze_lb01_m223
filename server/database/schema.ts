const users = `
CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT,
    username text NOT NULL UNIQUE,
    password text NOT NULL,
    role VARCHAR(30) NOT NULL,
    PRIMARY KEY (id)
);
`;

const posts = `
CREATE TABLE IF NOT EXISTS posts (
    id INT NOT NULL AUTO_INCREMENT,
    userId INT NOT NULL,
    content text NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
`;

const comments = `
CREATE TABLE IF NOT EXISTS comments (
    id INT NOT NULL AUTO_INCREMENT,
    userId INT NOT NULL,
    postId INT NOT NULL,
    content text NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
);
`;

const likes = `
CREATE TABLE IF NOT EXISTS likes (
    id INT NOT NULL AUTO_INCREMENT,
    postId INT NOT NULL,
    userId INT NOT NULL,
    isPositive boolean NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
`;

export { users, posts, comments, likes };
