import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


export const enviarEmailTemplate = async (to, subject, templateName, context) => {
    try {

        const templatePath = path.resolve(__dirname, '../templates/emails', `${templateName}.hbs`);
        

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template não encontrado no caminho: ${templatePath}`);
        }


        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const compiledTemplate = handlebars.compile(templateSource);
        

        const htmlFinal = compiledTemplate(context);


        const info = await transporter.sendMail({
            from: `"Sistema Nimbus" <${process.env.EMAIL_FROM}>`,
            to: to,
            subject: subject,
            html: htmlFinal
        });

        console.log(`[Email] Enviado com sucesso para: ${to} | ID: ${info.messageId}`);
        return info;

    } catch (error) {
        console.error(`[Email Error] Falha ao enviar para ${to}:`, error.message);

        throw error;
    }
};