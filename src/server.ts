import fastify from "fastify";
import { prisma } from "./lib/prisma";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { createTrip } from "./routes/create-trip";
const app = fastify();
let port = 3333;
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(createTrip);

app.get("/trips", async () => {
  const trips = await prisma.trip.findMany();
  return trips;
});

function server() {
  try {
    app.listen({ port }).then(() => {
      console.log(
        `server running on at  http://localhost:${port} at ${new Date().toLocaleTimeString()}`
      );
    });
  } catch (e) {
    port++;
    server();
  }
}
server();
