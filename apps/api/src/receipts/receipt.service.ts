import { Injectable, Logger } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import {
  SupabaseStorageService,
  StoredFile,
} from '../storage/supabase-storage.service';

type FontDictionary = Record<
  string,
  {
    normal: string;
    bold: string;
    italics: string;
    bolditalics: string;
  }
>;

function getPdfFonts(): { fonts: FontDictionary; defaultFont: string } {
  const fallback: { fonts: FontDictionary; defaultFont: string } = {
    fonts: {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    },
    defaultFont: 'Helvetica',
  };

  try {
    const pdfmakeRoot = join(require.resolve('pdfmake/package.json'), '..');
    const fontsDir = join(pdfmakeRoot, 'fonts');
    if (!existsSync(join(fontsDir, 'Roboto-Regular.ttf'))) {
      return fallback;
    }

    return {
      fonts: {
        Roboto: {
          normal: join(fontsDir, 'Roboto-Regular.ttf'),
          bold: join(fontsDir, 'Roboto-Medium.ttf'),
          italics: join(fontsDir, 'Roboto-Italic.ttf'),
          bolditalics: join(fontsDir, 'Roboto-MediumItalic.ttf'),
        },
      },
      defaultFont: 'Roboto',
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      'pdfmake fonts not found, falling back to built-in Helvetica fonts',
      error,
    );
    return fallback;
  }
}

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);
  private readonly printer: PdfPrinter;
  private readonly defaultFont: string;

  constructor(private readonly storage: SupabaseStorageService) {
    const { fonts, defaultFont } = getPdfFonts();
    this.printer = new PdfPrinter(fonts);
    this.defaultFont = defaultFont;
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
      { text: `Cliente: ${params.loan.borrowerName}` },
    ];

    if (params.loan.borrowerPhone) {
      content.push({ text: `Teléfono: ${params.loan.borrowerPhone}` });
    }

    content.push(
      { text: `Fecha: ${params.payment.paidAt.toLocaleString('es-AR')}` },
      { text: `Importe: $${params.payment.amount}` },
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
          margin: [0, 0, 0, 12],
        },
      },
      defaultStyle: {
        font: this.defaultFont,
      },
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
