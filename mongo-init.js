db = db.getSiblingDB("GameDatabase");

db.createUser({
    user: "gameuser",
    pwd: "gamepass123",
    roles: [
        { role: "readWrite", db: "GameDatabase" }
    ]
});

db.Users.insertOne({
    Username: "admin",
    Email: "admin@example.com",
    PasswordHash: "$2a$11$k/Ocs6QP07AdmUMbvkljFejdQacGZPiZHT2/4Axy6qqnl8fC0zgMi",
    Roles: [
        "User",
        "Admin"
    ],
    ExternalLogins: []
});