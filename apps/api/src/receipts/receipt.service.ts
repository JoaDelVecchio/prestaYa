import { Injectable, Logger } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { join } from 'node:path';
import { SupabaseStorageService, StoredFile } from '../storage/supabase-storage.service';

function getPdfFonts() {
  const pdfmakeRoot = join(require.resolve('pdfmake/package.json'), '..');
  const fontsDir = join(pdfmakeRoot, 'fonts');
  return {
    Roboto: {
      normal: join(fontsDir, 'Roboto-Regular.ttf'),
      bold: join(fontsDir, 'Roboto-Medium.ttf'),
      italics: join(fontsDir, 'Roboto-Italic.ttf'),
      bolditalics: join(fontsDir, 'Roboto-MediumItalic.ttf')
    }
  };
}

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);
  private readonly printer: PdfPrinter;

  constructor(private readonly storage: SupabaseStorageService) {
    this.printer = new PdfPrinter(getPdfFonts());
  }

  async generateReceipt(params: {
    orgId: string;
    loan: {
      id: string;
      borrowerName: string;
      borrowerPhone?: string | null;
    };
    payment: {
      id: string;
      amount: string;
      paidAt: Date;
      method?: string | null;
    };
  }): Promise<StoredFile> {
    const content: Content[] = [
      { text: 'Recibo de Pago', style: 'header' },
      { text: `Préstamo: ${params.loan.id}` },
      { text: `Cliente: ${params.loan.borrowerName}` }
    ];

    if (params.loan.borrowerPhone) {
      content.push({ text: `Teléfono: ${params.loan.borrowerPhone}` });
    }

    content.push(
      { text: `Fecha: ${params.payment.paidAt.toLocaleString('es-AR')}` },
      { text: `Importe: $${params.payment.amount}` }
    );

    if (params.payment.method) {
      content.push({ text: `Método: ${params.payment.method}` });
    }

    const docDefinition: TDocumentDefinitions = {
      content,
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          margin: [0, 0, 0, 12]
        }
      }
    };

    const buffer = await this.renderPdf(docDefinition);
    return this.storage.uploadReceipt(params.orgId, params.loan.id, buffer);
  }

  private renderPdf(docDefinition: TDocumentDefinitions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = this.printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (error) => reject(error));

        doc.end();
      } catch (error) {
        this.logger.error('Failed to render PDF', error as Error);
        reject(error);
      }
    });
  }
}
