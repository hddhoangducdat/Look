import { createConnection } from "typeorm";
import path from "path";
import { User } from "./entities/User";
import express from "express";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import session from "express-session";
import { ApolloServer } from "apollo-server-express";
import { COOKIE_NAME, __prod__ } from "./constances";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/user";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "ELearning",
    username: "noir",
    password: "1",
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, ".migrations/*")],
    entities: [User],
  });
  await conn.runMigrations();

  const app = express();

  let RedisStore = connectRedis(session);
  let redis = new Redis();

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      secret: "asdfh29fheafdfasf2h3r123fhdsaf9",
      resave: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 2 * 365 * 10,
        httpOnly: true,
        sameSite: "lax",
        secure: __prod__,
      },
      saveUninitialized: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
    }),
  });

  app.listen(4000, () => {
    console.log("server started on localhost 4000");
  });
};

main().catch((err) => {
  console.log(err);
});
