import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "../../user/entity/user.entity";

@Entity()
export class Income {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  source: string;

  @Column("decimal", { precision: 12, scale: 2 })
  amount: number;

  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
