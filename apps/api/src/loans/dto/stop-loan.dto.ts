import { IsOptional, IsString } from 'class-validator';

export class StopLoanDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
