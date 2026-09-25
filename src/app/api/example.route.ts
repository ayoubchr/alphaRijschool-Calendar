import { Resend } from 'resend';
import { EmailTemplate } from "@/components/example-email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const {
            name,
            email_1,
            email_2,
            level,
            classtype,
            paymentAmount,
            street,
            housenumber,
            postalcode,
            city,
            phone_1,
            phone_2
        } = await req.json();

        const { data, error } = await resend.emails.send({
            from: 'CEMI <kids@cemi-antwerp.be>',
            to: [email_1],
            cc: [email_2],
            subject: 'Bevestiging van je inschrijving',
            react: await EmailTemplate({ name, level, classtype, paymentAmount, street, housenumber, postalcode, city, phone_1, phone_2 }),
        });

        if (error) {
            return Response.json({ error }, { status: 500 });
        }

        return Response.json(data);
    } catch (error) {
        return Response.json({ error }, { status: 500 });
    }
}