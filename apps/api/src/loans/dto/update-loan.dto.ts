import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LoanStatus } from '@prestaya/prisma';

export class UpdateLoanDto {
  @IsOptional()
  @IsString()
  borrowerName?: string;

  @IsOptional()
  @IsString()
  borrowerPhone?: string;

  @IsOptional()
  @IsString()
  borrowerDni?: string;

  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  interestRate?: number;

  @IsOptional()
  @IsDateString()
  maturityDate?: string;
}
