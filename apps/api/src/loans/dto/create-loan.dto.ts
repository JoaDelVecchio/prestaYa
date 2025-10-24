import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateLoanDto {
  @IsString()
  @IsNotEmpty()
  borrowerName!: string;

  @IsOptional()
  @IsString()
  borrowerPhone?: string;

  @IsString()
  @IsNotEmpty()
  borrowerDni!: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsNumber()
  @IsPositive()
  principal!: number;

  @IsNumber()
  @Min(0)
  interestRate!: number;

  @IsInt()
  @IsPositive()
  numberOfInstallments!: number;

  @IsDateString()
  firstDueDate!: string;

  @IsString()
  frequency!: 'weekly' | 'biweekly' | 'monthly';
}
