import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { Schema, ZodType } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import dayjs from "dayjs";
import { getEmailClient } from "../lib/mailer";
import nodemailer from "nodemailer";

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/cadastrar",
    {
      schema: {
        body: z.object({
          destination: z.string().min(3).max(255),
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
          ownerName: z.string(),
          ownerEmail: z.string().email(),
          emails_to_invite: z.array(z.string().email()),
        }),
      },
    },
    async (request, reply) => {
      const {
        destination,
        startDate,
        endDate,
        ownerName,
        ownerEmail,
        emails_to_invite,
      } = request.body;
      if (dayjs(startDate).isAfter(dayjs(endDate))) {
        throw new Error(
          "A data de início não pode ser maior que a data de fim"
        );
      }
      if (dayjs(startDate).isBefore(dayjs(new Date()))) {
        throw new Error("A data de início não pode ser menor que a data atual");
      }
      const trip = await prisma.trip.create({
        data: {
          destination,
          startDate,
          endDate,
          Participant: {
            createMany: {
              data: [
                {
                  name: ownerName,
                  email: ownerEmail,
                  isOwner: true,
                  isConfirmed: true,
                },
                ...emails_to_invite.map((email) => ({
                  name: "",
                  email,
                  isOwner: false,
                  isConfirmed: false,
                })),
              ],
            },
          },
        },
      });
      const validationLink = `http://localhost:3333/trip/validate/${trip.id}`;
      const mail = await getEmailClient();
      const message = await mail.sendMail({
        from: { name: "Trip Planner", address: "equipe@TP" },
        to: {
          name: ownerName,
          address: ownerEmail,
        },
        subject: `viagem para ${destination}cadastrada com sucesso`,
        html: `<div>
        <p>Olá, uma nova viagem para ${destination} foi cadastrada para o dia ${startDate} </p>
        <p>Confira os detalhes da viagem:</p>
        <p>Destino: ${destination}</p>
        <p>Data de início: ${startDate}</p>
        <p>Data de fim: ${endDate}</p>
        <a href="${validationLink}">clique aqui para confirmar sua inscrição</a>
        `,
      });
      console.log(nodemailer.getTestMessageUrl(message));
      return { destination, startDate, endDate };
    }
  );
}
