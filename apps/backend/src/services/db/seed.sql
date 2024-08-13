CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY UNIQUE NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "first_name" VARCHAR(255) NOT NULL,
  "last_name" VARCHAR(255) NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE "exams" (
  "id" VARCHAR(255) UNIQUE NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "user_id" INTEGER NOT NULL REFERENCES "users" ("id")
);
