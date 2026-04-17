import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFExportOptions {
    title: string;
    subtitle?: string;
    filename: string;
    appSettings: {
        kop_nama: string;
        kop_rs: string;
        kop_alamat: string;
        kop_kontak: string;
    };
    printDate: string;
    signerName: string;
    signerRole: string;
    tableHeaders: string[];
    tableData: any[][];
    additionalInfo?: string[];
    additionalInfoBottom?: string[];
    tableHeadersBottom?: string[];
    tableDataBottom?: any[][];
}

export const generateFormalPDF = (options: PDFExportOptions) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const margin = 15;
    let yPos = margin;
    const pageWidth = doc.internal.pageSize.width;

    // --- KOP SURAT ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(options.appSettings.kop_nama.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;

    doc.setFontSize(16);
    doc.text(options.appSettings.kop_rs.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(options.appSettings.kop_alamat, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(options.appSettings.kop_kontak, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 1;
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // --- TITLE ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(options.title.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;

    if (options.subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(options.subtitle, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
    }

    if (options.additionalInfo && options.additionalInfo.length > 0) {
        doc.setFontSize(10);
        options.additionalInfo.forEach(info => {
            doc.text(info, margin, yPos);
            yPos += 5;
        });
        yPos += 3;
    }

    // --- TABLE ---
    autoTable(doc, {
        startY: yPos,
        head: [options.tableHeaders],
        body: options.tableData,
        theme: 'striped',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [47, 54, 64],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        margin: { left: margin, right: margin },
    });

    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 10;

    if (options.additionalInfoBottom && options.additionalInfoBottom.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        options.additionalInfoBottom.forEach(info => {
            doc.text(info, margin, finalY);
            finalY += 5;
        });
        finalY += 3;
    }

    if (options.tableHeadersBottom && options.tableDataBottom) {
        autoTable(doc, {
            startY: finalY,
            head: [options.tableHeadersBottom],
            body: options.tableDataBottom,
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [47, 54, 64],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            margin: { left: margin, right: margin },
        });
        // @ts-ignore
        finalY = doc.lastAutoTable.finalY + 15;
    } else {
        finalY += 5;
    }

    // Check if new page is needed for signature
    if (finalY > doc.internal.pageSize.height - 40) {
        doc.addPage();
        finalY = margin + 10;
    }

    const todayDate = new Date(options.printDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const location = options.appSettings.kop_nama.replace('Pemerintah ', '').replace('Provinsi ', '').replace('Kabupaten ', '');
    const signatureText = `${location}, ${todayDate}`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    // Align to right side
    const rightSideX = pageWidth - margin - 45;
    doc.text(signatureText, rightSideX, finalY, { align: 'center' });
    finalY += 25;

    doc.setFont('helvetica', 'bold');
    doc.text(options.signerName, rightSideX, finalY, { align: 'center' });
    // Underline
    const signerWidth = doc.getTextWidth(options.signerName);
    doc.line(rightSideX - (signerWidth / 2), finalY + 1, rightSideX + (signerWidth / 2), finalY + 1);

    finalY += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(options.signerRole, rightSideX, finalY, { align: 'center' });

    doc.save(options.filename);
};
