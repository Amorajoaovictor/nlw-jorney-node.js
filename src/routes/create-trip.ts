import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { Schema, ZodType } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import dayjs from "dayjs";

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/cadastrar",
    {
      schema: {
        body: z.object({
          destination: z.string().min(3).max(255),
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
        }),
      },
    },
    async (request, reply) => {
      const { destination, startDate, endDate } = request.body as any;
      if (dayjs(startDate).isAfter(dayjs(endDate))) {
        throw new Error(
          "A data de início não pode ser maior que a data de fim"
        );
      }
      if (dayjs(startDate).isBefore(dayjs(new Date()))) {
        throw new Error("A data de início não pode ser menor que a data atual");
      }

      await prisma.trip.create({
        data: {
          destination,
          startDate,
          endDate,
        },
      });
      return { destination, startDate, endDate };
    }
  );
}
