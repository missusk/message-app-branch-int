CREATE TABLE IF NOT EXISTS agents (
    agent_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    agent_id INT REFERENCES agents(agent_id) ON DELETE CASCADE,
    message_body TEXT NOT NULL,
    status TEXT DEFAULT 'unassigned',
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS responses (
    response_id SERIAL PRIMARY KEY,
    message_id INT REFERENCES messages(message_id) ON DELETE CASCADE,
    agent_id INT REFERENCES agents(agent_id) ON DELETE CASCADE,
    response_body TEXT NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
