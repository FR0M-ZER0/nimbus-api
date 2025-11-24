import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

export const generatePDF = (title, filters, data, type, res) => {
  const doc = new PDFDocument({ margin: 50 });

  const filename = `${type}_${Date.now()}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

  doc.pipe(res);

  let stationName = filters.id_estacao;
  if (data.length > 0) {
      if (type === 'medidas') stationName = data[0].parametro?.estacao?.nome || filters.id_estacao;
      else stationName = data[0].medida?.parametro?.estacao?.nome || filters.id_estacao;
  }

  doc.fontSize(20).text('Nimbus System', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).text(title, { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(10);
  doc.text(`Estação: ${stationName}`); 
  doc.text(`Período: ${format(filters.startDate, 'dd/MM/yyyy')} até ${format(filters.endDate, 'dd/MM/yyyy')}`);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`);
  
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); 
  doc.moveDown();

  if (data.length === 0) {
    doc.fontSize(12).text('Nenhum registro encontrado para esta estação neste período.', { align: 'center' });
  } else {
    const tableTop = doc.y;
    const itemX = 50;
    const dateX = 300;
    const valueX = 450;

    doc.font('Helvetica-Bold');
    if (type === 'medidas') {
        doc.text('Parâmetro', itemX, tableTop); 
        doc.text('Data/Hora', dateX, tableTop);
        doc.text('Valor', valueX, tableTop);
    } else {
        doc.text('Alerta / Usuário', itemX, tableTop);
        doc.text('Data Ocorrência', dateX, tableTop);
        doc.text('Tipo', valueX, tableTop);
    }
    doc.font('Helvetica');
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    data.forEach((item) => {
        const y = doc.y;
        if (y > 700) doc.addPage();

        if (type === 'medidas') {
            const paramName = item.parametro?.tipo_parametro?.nome || 'N/A';
            const dateObj = new Date(item.data_hora * 1000); 
            const dateStr = format(dateObj, 'dd/MM/yyyy HH:mm');
            const valueStr = `${item.valor} ${item.parametro?.tipo_parametro?.unidade || ''}`;
            
            doc.text(paramName, itemX, y);
            doc.text(dateStr, dateX, y);
            doc.text(valueStr, valueX, y);
        } else {
            const title = item.alerta?.titulo || 'Sem título';
            const user = item.usuario?.nome || 'Sistema';
            const dateStr = format(new Date(item.created_at), 'dd/MM/yyyy HH:mm');
            const typeStr = 'Alarme';

            doc.text(`${title} - ${user}`, itemX, y);
            doc.text(dateStr, dateX, y);
            doc.text(typeStr, valueX, y);
        }
        doc.moveDown();
    });
  }

  doc.end();
};