import { IsNumber, IsOptional, IsString, IsUUID, IsPositive } from 'class-validator';

export class PaymentReceivedDto {
  @IsUUID()
  loanId!: string;

  @IsOptional()
  @IsUUID()
  installmentId?: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  method?: string;
}
