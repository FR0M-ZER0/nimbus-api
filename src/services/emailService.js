import transporter from '../config/mailer.js';
import dotenv from 'dotenv';

dotenv.config();

export const sendAlertEmail = async (to, userName, alertData) => {
    const subject = `🚨 Novo Alerta: ${alertData.titulo}`;
    
    const htmlContent = `
        <h1>Novo Alerta Gerado</h1>
        <p>Olá ${userName || 'usuário'},</p>
        <p>Um novo alerta foi registrado no sistema:</p>
        <p><strong>Título:</strong> ${alertData.titulo}</p>
        <p><strong>Mensagem:</strong> ${alertData.texto || 'Sem mensagem adicional.'}</p>
        <p><strong>Data/Hora:</strong> ${new Date(alertData.data_hora).toLocaleString('pt-BR')}</p>
        <hr>
        <p>Atenciosamente,</p>
        <p>Equipe Nimbus</p> 
    `;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: subject,
        html: htmlContent,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email de alerta enviado para ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`Erro ao enviar email de alerta para ${to}:`, error);
    }
};
