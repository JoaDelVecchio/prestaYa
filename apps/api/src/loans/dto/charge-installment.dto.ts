import { IsOptional, IsString, IsUUID, IsNumber, IsPositive } from 'class-validator';

export class ChargeInstallmentDto {
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
