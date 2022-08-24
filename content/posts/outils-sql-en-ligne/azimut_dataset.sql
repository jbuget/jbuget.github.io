CREATE TABLE "Lists"(
    "id" INTEGER NOT NULL PRIMARY KEY,
    "project_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "archived_at" DATE NULL,
    "created_at" DATE NOT NULL,
    "updated_at" DATE NOT NULL
);
CREATE TABLE "Issues"(
    "id" INTEGER NOT NULL PRIMARY KEY,
    "project_id" INTEGER NOT NULL,
    "list_id" INTEGER NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NULL,
    "order" INTEGER NOT NULL,
    "archived_at" DATE NULL,
    "created_at" DATE NOT NULL,
    "updated_at" DATE NOT NULL
);
CREATE TABLE "Attachments"(
    "id" INTEGER NOT NULL PRIMARY KEY,
    "issue_id" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "description" TEXT NULL,
    "created_at" DATE NOT NULL,
    "updated_at" DATE NOT NULL
);
CREATE TABLE "Accounts"(
    "id" INTEGER NOT NULL PRIMARY KEY,
    "first_name" TEXT NULL,
    "last_name" TEXT NULL,
    "nickname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" DATE NOT NULL,
    "updated_at" DATE NOT NULL
);
CREATE TABLE "Projects"(
    "id" INTEGER NOT NULL PRIMARY KEY,
    "team_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NULL,
    "archived_at" DATE NULL,
    "created_at" DATE NOT NULL,
    "updated_at" DATE NOT NULL
);
CREATE TABLE "Teams"(
    "id" INTEGER NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logo_url" TEXT NOT NULL,
    "created_at" DATE NOT NULL,
    "updated_at" DATE NOT NULL
);
CREATE TABLE "Memberships"(
    "id" INTEGER NOT NULL PRIMARY KEY,
    "account_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "role" VARCHAR(255) CHECK
        ("role" IN('')) NOT NULL,
        "created_at" DATE NOT NULL,
        "updated_at" DATE NOT NULL
);
CREATE TABLE "Contributors"(
    "id" INTEGER NOT NULL PRIMARY KEY,
    "account_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "role" VARCHAR(255) CHECK
        ("role" IN('')) NOT NULL,
        "created_at" DATE NOT NULL,
        "updated_at" DATE NOT NULL
);
CREATE TABLE "Comments"(
    "id" INTEGER NOT NULL PRIMARY KEY,
    "account_id" INTEGER NOT NULL,
    "issue_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATE NOT NULL,
    "updated_at" DATE NOT NULL
);
ALTER TABLE
    "Issues" ADD CONSTRAINT "issues_list_id_foreign" FOREIGN KEY ("list_id") REFERENCES "Lists"("id");
ALTER TABLE
    "Issues" ADD CONSTRAINT "issues_project_id_foreign" FOREIGN KEY ("project_id") REFERENCES "Projects"("id");
ALTER TABLE
    "Lists" ADD CONSTRAINT "lists_project_id_foreign" FOREIGN KEY ("project_id") REFERENCES "Projects"("id");
ALTER TABLE
    "Attachments" ADD CONSTRAINT "attachments_issue_id_foreign" FOREIGN KEY ("issue_id") REFERENCES "Issues"("id");
ALTER TABLE
    "Memberships" ADD CONSTRAINT "memberships_account_id_foreign" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id");
ALTER TABLE
    "Memberships" ADD CONSTRAINT "memberships_team_id_foreign" FOREIGN KEY ("team_id") REFERENCES "Teams"("id");
ALTER TABLE
    "Projects" ADD CONSTRAINT "projects_team_id_foreign" FOREIGN KEY ("team_id") REFERENCES "Teams"("id");
ALTER TABLE
    "Contributors" ADD CONSTRAINT "contributors_account_id_foreign" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id");
ALTER TABLE
    "Contributors" ADD CONSTRAINT "contributors_project_id_foreign" FOREIGN KEY ("project_id") REFERENCES "Projects"("id");
ALTER TABLE
    "Comments" ADD CONSTRAINT "comments_account_id_foreign" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id");
ALTER TABLE
    "Comments" ADD CONSTRAINT "comments_issue_id_foreign" FOREIGN KEY ("issue_id") REFERENCES "Issues"("id");

