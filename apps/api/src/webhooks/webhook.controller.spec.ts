import { WebhookController } from './webhook.controller';
import { RequestContextService } from '../common/request-context.service';
import { PaymentReceivedDto } from './dto/payment-received.dto';

describe('WebhookController', () => {
  let controller: WebhookController;
  let context: RequestContextService;
  const loans = {
    charge: jest.fn()
  } as any;

  beforeEach(() => {
    context = new RequestContextService();
    controller = new WebhookController(loans, context);
    loans.charge.mockResolvedValue({ ok: true });
    process.env.WEBHOOK_SECRET = 'secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.WEBHOOK_SECRET;
  });

  it('runs loan charge inside request context', async () => {
    const dto: PaymentReceivedDto = {
      loanId: 'loan-1',
      installmentId: 'inst-1',
      amount: 200,
      method: 'cash'
    };
    const runSpy = jest.spyOn(context, 'run');

    await controller.paymentReceived(dto, 'org-1', 'secret');

    expect(runSpy).toHaveBeenCalled();
    expect(loans.charge).toHaveBeenCalledWith('loan-1', {
      installmentId: 'inst-1',
      amount: 200,
      method: 'cash'
    });
  });

  it('throws when secret mismatch', async () => {
    const dto: PaymentReceivedDto = {
      loanId: 'loan-1',
      amount: 200
    };

    await expect(controller.paymentReceived(dto, 'org-1', 'wrong')).rejects.toThrow('Invalid webhook secret');
  });
});
