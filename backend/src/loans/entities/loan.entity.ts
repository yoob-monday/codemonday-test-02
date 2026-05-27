export enum LoanStatus {
  BORROWED = 'borrowed',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
}

export interface Loan {
  id: string;
  loanCode: string;
  bookId: string;
  memberId: string;
  loanDate: Date;
  dueDate: Date;
  returnedAt: Date | null;
  status: LoanStatus;
  fineAmount: number;
}
