module.exports = {
    apps: [
        {
            name: "ta-portfolio",
            cwd: "/root/TA-Portfolio",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                PORT: 3021,
                DATABASE_URL: "file:./dev.db",
                GHOST_API_URL: "https://ghost.tinyark.com",
                GHOST_CONTENT_KEY: "a78cbc63ecdfd413302d6639d1",
                SITE_URL: "https://portfolio.tinyark.com"
            }
        }
    ]
}