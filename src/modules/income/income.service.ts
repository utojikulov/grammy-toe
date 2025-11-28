import { Repository } from "typeorm";
import { Income } from "./entity/income.entity";
import { AppDataSource } from "../../data-source";
import { User } from "../user/entity/user.entity";

export class IncomeService {
    private incomeRepository: Repository<Income>;

    constructor() {
        this.incomeRepository = AppDataSource.getRepository(Income);
    }

    async addIncome(payload: {
        user: User;
        source: string;
        amount: number;
    }): Promise<Income> {
        const income = this.incomeRepository.create({
            user: payload.user,
            source: payload.source,
            amount: payload.amount,
        });
        return this.incomeRepository.save(income);
    }

    async getUserIncomes(user: User): Promise<Income[]> {
        return this.incomeRepository.find({
            where: { user: { id: user.id } },
            order: { createdAt: "DESC" },
        });
    }

    async getUserIncomesByPeriod(user: User, from: Date, to: Date): Promise<Income[]> {
        return this.incomeRepository
            .createQueryBuilder("income")
            .where("income.userId = :userId", { userId: user.id })
            .andWhere("income.createdAt BETWEEN :from AND :to", { from, to })
            .orderBy("income.createdAt", "DESC")
            .getMany();
    }

    async getTotalIncome(user: User): Promise<number> {
        const { sum } = await this.incomeRepository
            .createQueryBuilder("income")
            .select("SUM(income.amount)", "sum")
            .where("income.userId = :userId", { userId: user.id })
            .getRawOne();
        return Number(sum) || 0;
    }
}
