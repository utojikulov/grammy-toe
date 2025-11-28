import { Repository } from "typeorm";
import { Expense, ExpenseCategory } from "./entity/expense.entity";
import { User } from "../user/entity/user.entity";
import { AppDataSource } from "../../data-source";

export class ExpenseService {
    private expenseRepository: Repository<Expense>;

    constructor() {
        this.expenseRepository = AppDataSource.getRepository(Expense);
    }

    async addExpense(params: {
        user: User;
        title: string;
        amount: number;
        category: ExpenseCategory;
    }): Promise<Expense> {
        const expense = this.expenseRepository.create({
            title: params.title,
            amount: params.amount,
            category: params.category,
            user: params.user,
            user_id: params.user.id,
        });
        return this.expenseRepository.save(expense);
    }

    async getUserExpenses(user: User, options?: { limit?: number; offset?: number }): Promise<Expense[]> {
        return this.expenseRepository.find({
            where: { user: { id: user.id } },
            order: { createdAt: "DESC" },
            take: options?.limit,
            skip: options?.offset,
        });
    }

    async getExpensesByPeriod(user: User, from: Date, to: Date): Promise<Expense[]> {
        return this.expenseRepository
            .createQueryBuilder("expense")
            .where("expense.user_id = :userId", { userId: user.id })
            .andWhere("expense.createdAt BETWEEN :from AND :to", { from, to })
            .orderBy("expense.createdAt", "DESC")
            .getMany();
    }

    async getTotalByCategory(user: User, from?: Date, to?: Date): Promise<Record<ExpenseCategory, number>> {
        const qb = this.expenseRepository
            .createQueryBuilder("expense")
            .select("expense.category", "category")
            .addSelect("SUM(expense.amount)", "total")
            .where("expense.user_id = :userId", { userId: user.id });

        if (from && to) {
            qb.andWhere("expense.createdAt BETWEEN :from AND :to", { from, to });
        }

        qb.groupBy("expense.category");

        const result = await qb.getRawMany();
        const totals: Record<ExpenseCategory, number> = {} as any;
        for (const row of result) {
            totals[row.category] = Number(row.total);
        }
        return totals;
    }
}
