import { User } from "../user/entity/user.entity";
import { ExpenseService } from "../expense/expense.service";
import { IncomeService } from "../income/income.service";
import { ExpenseCategory } from "../expense/entity/expense.entity";

export class ReportService {
    private expenseService: ExpenseService;
    private incomeService: IncomeService;

    constructor() {
        this.expenseService = new ExpenseService();
        this.incomeService = new IncomeService();
    }

    async getUserReport(user: User, from: Date, to: Date) {
        const expenses = await this.expenseService.getExpensesByPeriod(
            user,
            from,
            to,
        );
        const incomes = await this.incomeService.getUserIncomesByPeriod(
            user,
            from,
            to,
        );

        const totalsByCategory = await this.expenseService.getTotalByCategory(
            user,
            from,
            to,
        );

        const totalIncome = incomes.reduce(
            (sum, i) => sum + Number(i.amount),
            0,
        );
        const totalExpense = expenses.reduce(
            (sum, e) => sum + Number(e.amount),
            0,
        );
        const balance = totalIncome - totalExpense;

        return {
            totalIncome,
            totalExpense,
            balance,
            totalsByCategory,
            expenses,
            incomes,
        };
    }

    async getUserReportText(
        user: User,
        from: Date,
        to: Date,
        periodName: string,
    ) {
        const { totalIncome, totalExpense, balance, totalsByCategory } =
            await this.getUserReport(user, from, to);

        let report = `Отчёт за ${periodName}:\n\n`;
        report += `Доходы: ${totalIncome.toFixed(2)}\n`;
        report += `Расходы: ${totalExpense.toFixed(2)}\n`;
        report += `Баланс: ${balance.toFixed(2)}\n\n`;
        report += "Расходы по категориям:\n";
        for (const cat of Object.values(ExpenseCategory)) {
            report += `- ${cat}: ${(totalsByCategory[cat] || 0).toFixed(2)}\n`;
        }
        return report;
    }
}
