import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
    Index,
    OneToMany,
} from "typeorm";
import { Expense } from "../../expense/entity/expense.entity";
import { Income } from "../../income/entity/income.entity";

@Entity({ name: "users" })
@Unique(["telegramId"])
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "bigint" })
    @Index()
    telegramId: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    username?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    firstName?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    lastName?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Expense, (expense) => expense.user)
    expenses: Expense[];

    @OneToMany(() => Income, (income) => income.user)
    incomes: Income[];
}
