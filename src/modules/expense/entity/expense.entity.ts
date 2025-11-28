import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from "typeorm";
import { User } from "../../user/entity/user.entity";

export enum ExpenseCategory {
    FOOD = "Еда",
    TRANSPORT = "Транспорт",
    ENTERTAINMENT = "Развлечения",
    HEALTH = "Здоровье",
    UTILITIES = "Коммунальные услуги",
    OTHER = "Другое",
}

@Entity({ name: "expenses" })
export class Expense {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column("decimal", { precision: 12, scale: 2 })
    amount: number;

    @Column({
        type: "enum",
        enum: ExpenseCategory,
        default: ExpenseCategory.OTHER,
    })
    category: ExpenseCategory;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.expenses, {
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    user_id: number;
}
