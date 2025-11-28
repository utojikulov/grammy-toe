import { Bot, Context, session, SessionFlavor, Keyboard } from "grammy";
import { ConfigService } from "../../config/config.service";
import { UserService } from "../user/user.service";
import { ExpenseService } from "../expense/expense.service";
import { IncomeService } from "../income/income.service";
import { ExpenseCategory } from "../expense/entity/expense.entity";

interface MySessionData {
    expenseStep?: number;
    expenseTitle?: string;
    expenseAmount?: number;
    incomeStep?: number;
    incomeSource?: string;
    reportStep?: number;
}

type BotContext = Context & SessionFlavor<MySessionData>;

export class BotModule {
    private bot: Bot<BotContext>;
    private userService: UserService;
    private expenseService: ExpenseService;
    private incomeService: IncomeService;

    private mainKeyboard = new Keyboard()
        .text("➕ Добавить расход")
        .text("💰 Добавить доход")
        .row()
        .text("📊 Баланс")
        .text("📋 Отчёт");

    constructor(private readonly configService: ConfigService) {
        const token = this.configService.telegram.bot_api;
        if (!token) {
            throw new Error(
                "TELEGRAM_BOT_API token is not set in environment variables",
            );
        }
        this.bot = new Bot<BotContext>(token);
        this.bot.use(session({ initial: (): MySessionData => ({}) }));
        this.userService = new UserService();
        this.expenseService = new ExpenseService();
        this.incomeService = new IncomeService();
        this.registerBasicHandlers();
    }

    private registerBasicHandlers() {
        this.bot.command("start", async (ctx) => {
            const telegramId = String(ctx.from?.id);
            const username = ctx.from?.username;
            const firstName = ctx.from?.first_name;
            const lastName = ctx.from?.last_name;

            await this.userService.createOrUpdateFromTelegram({
                telegramId,
                username,
                firstName,
                lastName,
            });

            await ctx.reply(
                "👋 Привет! Я бот для учёта личных финансов.\n\nВыберите действие:",
                { reply_markup: this.mainKeyboard },
            );
        });

        this.bot.on("message:text", async (ctx) => {
            const telegramId = String(ctx.from?.id);
            const user = await this.userService.findByTelegramId(telegramId);
            if (!user) {
                return;
            }

            if (
                !ctx.session.expenseStep &&
                !ctx.session.incomeStep &&
                !ctx.session.reportStep
            ) {
                if (ctx.message.text === "➕ Добавить расход") {
                    ctx.session.expenseStep = 1;
                    ctx.session.expenseTitle = undefined;
                    ctx.session.expenseAmount = undefined;
                    await ctx.reply("Введите название расхода:", {
                        reply_markup: { remove_keyboard: true },
                    });
                    return;
                }
                if (ctx.message.text === "💰 Добавить доход") {
                    ctx.session.incomeStep = 1;
                    ctx.session.incomeSource = undefined;
                    await ctx.reply("Введите источник дохода:", {
                        reply_markup: { remove_keyboard: true },
                    });
                    return;
                }
                if (ctx.message.text === "📊 Баланс") {
                    const incomes =
                        await this.incomeService.getUserIncomes(user);
                    const expenses =
                        await this.expenseService.getUserExpenses(user);
                    const totalIncome = incomes.reduce(
                        (sum, i) => sum + Number(i.amount),
                        0,
                    );
                    const totalExpense = expenses.reduce(
                        (sum, e) => sum + Number(e.amount),
                        0,
                    );
                    const balance = totalIncome - totalExpense;
                    await ctx.reply(
                        `Ваш баланс: ${balance.toFixed(2)}\nДоходы: ${totalIncome.toFixed(2)}\nРасходы: ${totalExpense.toFixed(2)}`,
                        { reply_markup: this.mainKeyboard },
                    );
                    return;
                }
                if (ctx.message.text === "📋 Отчёт") {
                    ctx.session.reportStep = 1;
                    const periodKeyboard = new Keyboard()
                        .text("неделя")
                        .text("месяц")
                        .oneTime();
                    await ctx.reply("За какой период нужен отчёт?", {
                        reply_markup: periodKeyboard,
                    });
                    return;
                }
            }

            if (ctx.session.expenseStep === 1) {
                ctx.session.expenseTitle = ctx.message.text;
                ctx.session.expenseStep = 2;
                await ctx.reply("Введите сумму расхода:");
                return;
            }
            if (ctx.session.expenseStep === 2) {
                const amount = parseFloat(ctx.message.text.replace(",", "."));
                if (isNaN(amount) || amount <= 0) {
                    await ctx.reply("Пожалуйста, введите корректную сумму.");
                    return;
                }
                ctx.session.expenseAmount = amount;
                ctx.session.expenseStep = 3;
                const categoryKeyboard = new Keyboard()
                    .text(ExpenseCategory.FOOD)
                    .text(ExpenseCategory.TRANSPORT)
                    .row()
                    .text(ExpenseCategory.ENTERTAINMENT)
                    .text(ExpenseCategory.HEALTH)
                    .row()
                    .text(ExpenseCategory.UTILITIES)
                    .text(ExpenseCategory.OTHER)
                    .oneTime();
                await ctx.reply("Выберите категорию расхода:", {
                    reply_markup: categoryKeyboard,
                });
                return;
            }
            if (ctx.session.expenseStep === 3) {
                const category = ctx.message.text as ExpenseCategory;
                if (!Object.values(ExpenseCategory).includes(category)) {
                    await ctx.reply(
                        "Пожалуйста, выберите одну из категорий: " +
                            Object.values(ExpenseCategory).join(", "),
                    );
                    return;
                }
                await this.expenseService.addExpense({
                    user,
                    title: ctx.session.expenseTitle!,
                    amount: ctx.session.expenseAmount!,
                    category,
                });
                ctx.session.expenseStep = undefined;
                ctx.session.expenseTitle = undefined;
                ctx.session.expenseAmount = undefined;
                await ctx.reply("Расход успешно добавлен!", {
                    reply_markup: this.mainKeyboard,
                });
                return;
            }

            if (ctx.session.incomeStep === 1) {
                ctx.session.incomeSource = ctx.message.text;
                ctx.session.incomeStep = 2;
                await ctx.reply("Введите сумму дохода:");
                return;
            }
            if (ctx.session.incomeStep === 2) {
                const amount = parseFloat(ctx.message.text.replace(",", "."));
                if (isNaN(amount) || amount <= 0) {
                    await ctx.reply("Пожалуйста, введите корректную сумму.");
                    return;
                }
                await this.incomeService.addIncome({
                    user,
                    source: ctx.session.incomeSource!,
                    amount,
                });
                ctx.session.incomeStep = undefined;
                ctx.session.incomeSource = undefined;
                await ctx.reply("Доход успешно добавлен!", {
                    reply_markup: this.mainKeyboard,
                });
                return;
            }

            if (ctx.session.reportStep === 1) {
                const period = ctx.message.text.trim().toLowerCase();
                let from: Date;
                let to = new Date();
                if (period === "неделя") {
                    from = new Date();
                    from.setDate(to.getDate() - 7);
                } else if (period === "месяц") {
                    from = new Date();
                    from.setMonth(to.getMonth() - 1);
                } else {
                    await ctx.reply(
                        "Пожалуйста, выберите период с помощью кнопки.",
                    );
                    return;
                }

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

                const totalsByCategory =
                    await this.expenseService.getTotalByCategory(
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

                let report = `Отчёт за ${period === "неделя" ? "последнюю неделю" : "последний месяц"}:\n\n`;
                report += `Доходы: ${totalIncome.toFixed(2)}\n`;
                report += `Расходы: ${totalExpense.toFixed(2)}\n`;
                report += `Баланс: ${balance.toFixed(2)}\n\n`;
                report += "Расходы по категориям:\n";
                for (const cat of Object.values(ExpenseCategory)) {
                    report += `- ${cat}: ${(totalsByCategory[cat] || 0).toFixed(2)}\n`;
                }

                await ctx.reply(report, {
                    reply_markup: this.mainKeyboard,
                });
                ctx.session.reportStep = undefined;
                return;
            }
        });
    }

    public async launch() {
        await this.bot.start();
        console.log("🤖 Telegram-бот запущен!");
    }
}
