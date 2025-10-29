import { WebhookController } from './webhook.controller';
import { RequestContextService } from '../common/request-context.service';
import { PaymentReceivedDto } from './dto/payment-received.dto';

describe('WebhookController', () => {
  let controller: WebhookController;
  let context: RequestContextService;
  const loans = {
    charge: jest.fn(),
  } as any;

  beforeEach(() => {
    context = new RequestContextService();
    controller = new WebhookController(loans, context);
    loans.charge.mockResolvedValue({ ok: true });
    process.env.WEBHOOK_SECRET = 'secret';
    process.env.N8N_WEBHOOK_SECRET = 'secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.WEBHOOK_SECRET;
    delete process.env.N8N_WEBHOOK_SECRET;
  });

  it('runs loan charge inside request context', async () => {
    const dto: PaymentReceivedDto = {
      loanId: 'loan-1',
      installmentId: 'inst-1',
      amount: 200,
      method: 'cash',
    };
    const runSpy = jest.spyOn(context, 'runWithRequest');
    const setContextSpy = jest.spyOn(context, 'setContext');
    const req: any = { headers: {} };

    await controller.paymentReceived(dto, 'org-1', 'secret', req);

    expect(runSpy).toHaveBeenCalledWith(req, expect.any(Function));
    expect(setContextSpy).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ orgId: 'org-1' }),
    );
    expect(loans.charge).toHaveBeenCalledWith('loan-1', {
      installmentId: 'inst-1',
      amount: 200,
      method: 'cash',
    });
  });

  it('throws when secret mismatch', async () => {
    const dto: PaymentReceivedDto = {
      loanId: 'loan-1',
      amount: 200,
    };

    await expect(
      controller.paymentReceived(dto, 'org-1', 'wrong', { headers: {} } as any),
    ).rejects.toThrow('Invalid webhook secret');
  });
});
