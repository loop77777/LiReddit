import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@ObjectType()
@Entity()
export class User extends BaseEntity{
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn() // date column
  createdAt: Date; // DON'T need to initialize date. It will be automatically initialized

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column({ unique: true }) // unique column, it automatically have type feature
  username!: string;

  @Field()
  @Column({ unique: true }) // unique column
  email!: string;

  @Column()
  password!: string;
}
